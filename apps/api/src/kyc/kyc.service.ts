import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, prisma } from '@repo/db';
import { OnrampMoneyKycStatus } from 'src/types/onramp-money.types';
import {
  getOnrampMoneyKycStatus,
  getOnrampMoneyKycUrl,
} from 'src/apis/onramp-money/kyc';
import {
  KycStatusResponseDto,
  StartKycResponseDto,
} from './dto/kyc-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KycService {
  constructor(private readonly configService: ConfigService) {}

  async startKyc(
    clientId: string,
    clientUserId: string,
  ): Promise<StartKycResponseDto> {
    const clientUser = await prisma.clientUser.findUnique({
      where: { clientId_clientUserId: { clientId, clientUserId } },
      include: {
        user: {
          include: { kycSession: true },
        },
      },
    });

    if (!clientUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has KYC (from any client)
    if (clientUser.user.kycSession.status !== KycStatus.NOT_STARTED) {
      const session = clientUser.user.kycSession;

      // KYC in progress/completed, return existing session
      return {
        clientUserId: clientUser.clientUserId,
        kycId: session.id,
        kycLink: session.kycLink,
        kycStatus: session.status,
      };
    }

    // Call KYC provider API
    const onrampKycData = await getOnrampMoneyKycUrl({
      type: 'INDIVIDUAL',
      email: clientUser.user.email,
      phoneNumber: clientUser.user.phone,
      clientCustomerId: clientUser.user.id,
      customerId: clientUser.providerCustomerId || undefined,
    });

    let customerId: string | null = null;
    let kycUrl: string | null = null;

    // New customer with provider, we get both customerId and KYC URL
    if (onrampKycData.type === 'NEW_CUSTOMER') {
      customerId = onrampKycData.customerId;
      kycUrl = onrampKycData.kycUrl;
    }

    // Customer already registered, fetch URL using customerId
    if (onrampKycData.type === 'EXISTING_CUSTOMER') {
      // Pass customer ID to get existing KYC URL
      const onrampKycDataExisting = await getOnrampMoneyKycUrl({
        type: 'INDIVIDUAL',
        email: clientUser.user.email,
        phoneNumber: clientUser.user.phone,
        clientCustomerId: clientUser.user.id,
        customerId: onrampKycData.customerId,
      });

      customerId = onrampKycDataExisting.customerId;

      // This will be true
      if ('kycUrl' in onrampKycDataExisting) {
        kycUrl = onrampKycDataExisting.kycUrl;
      }
    }

    if (!customerId || !kycUrl) {
      throw new BadGatewayException('Failed to get KYC URL or customer ID');
    }

    // If the user is new, we set the status to IN_PROGRESS
    let newKycStatus: KycStatus = KycStatus.IN_PROGRESS;

    // Get status if the customer already existed
    if (onrampKycData.type === 'EXISTING_CUSTOMER') {
      const onrampMoneyKycStatus = await getOnrampMoneyKycStatus(customerId);

      newKycStatus = KycService.onrampMoneyStatusToKYCStatus(
        onrampMoneyKycStatus.status,
      );
    }

    const updatedKycSession = await prisma.kycSession.update({
      where: {
        id: clientUser.user.kycSession.id,
      },
      data: {
        providerSessionId: customerId,
        kycLink: kycUrl,
        status: newKycStatus,
        kycProvider: 'onramp.money',
      },
    });

    return {
      clientUserId: clientUser.clientUserId,
      kycId: updatedKycSession.id!,
      kycLink: updatedKycSession.kycLink!,
      kycStatus: updatedKycSession.status,
    };
  }

  async getKycStatusByClientUserId(
    clientId: string,
    clientUserId: string,
  ): Promise<KycStatusResponseDto> {
    const clientUser = await prisma.clientUser.findUnique({
      where: {
        clientId_clientUserId: {
          clientId: clientId,
          clientUserId,
        },
      },
      include: {
        user: {
          include: { kycSession: true },
        },
      },
    });

    if (!clientUser) {
      throw new NotFoundException('User not found');
    }

    if (!clientUser.user.kycSession) {
      throw new NotFoundException(
        'KYC session not found for user, please start new KYC session',
      );
    }

    const session = clientUser.user.kycSession;

    // Get latest status from provider if not in NOT_STARTED or ADVANCED_COMPLETED
    if (
      session.status !== KycStatus.NOT_STARTED &&
      session.status !== KycStatus.ADVANCED_COMPLETED
    ) {
      const onrampMoneyKycStatus = await getOnrampMoneyKycStatus(
        session.providerSessionId!,
      );

      const newKycStatus = KycService.onrampMoneyStatusToKYCStatus(
        onrampMoneyKycStatus.status,
      );

      // If status has changed, update in DB
      if (session.status !== newKycStatus) {
        const updatedSession = await prisma.kycSession.update({
          where: { id: session.id },
          data: {
            status: newKycStatus,
          },
        });

        return {
          clientUserId: clientUser.clientUserId,
          kycId: updatedSession.id,
          kycLink: updatedSession.kycLink || '',
          kycStatus: updatedSession.status,
        };
      }
    }

    return {
      clientUserId: clientUser.clientUserId,
      kycId: session.id,
      kycLink: session.kycLink || '',
      kycStatus: session.status,
    };
  }

  async changeKycStatusByClientId(
    clientId: string,
    clientUserId: string,
    newStatus: KycStatus,
  ): Promise<KycStatusResponseDto> {
    if (this.configService.get<string>('ENVIORNMENT') !== 'sandbox') {
      throw new BadGatewayException(
        'This endpoint is only available in sandbox environment',
      );
    }

    if (newStatus === KycStatus.NOT_STARTED) {
      throw new BadRequestException(
        'Cannot change KYC status to NOT_STARTED, use other status values',
      );
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: {
        clientId_clientUserId: {
          clientId: clientId,
          clientUserId,
        },
      },
      include: {
        user: {
          include: { kycSession: true },
        },
      },
    });

    if (!clientUser) {
      throw new NotFoundException('User not found');
    }

    if (!clientUser.user.kycSession) {
      throw new NotFoundException(
        'KYC session not found for user, please start new KYC session',
      );
    }

    const session = clientUser.user.kycSession;

    const updatedSssion = await prisma.kycSession.update({
      where: { id: session.id },
      data: {
        status: newStatus,
      },
    });

    return {
      clientUserId: clientUser.clientUserId,
      kycId: updatedSssion.id,
      kycLink: updatedSssion.kycLink || '',
      kycStatus: updatedSssion.status,
    };
  }

  private static onrampMoneyStatusToKYCStatus(
    onrampMoneyStatus: OnrampMoneyKycStatus,
  ): KycStatus {
    switch (onrampMoneyStatus) {
      case 'OTP_COMPLETED':
      case 'IN_REVIEW':
        return KycStatus.IN_PROGRESS;
      case 'COMPLETED':
      case 'BASIC_KYC_COMPLETED':
      case 'INTERMEDIATE_KYC_COMPLETED':
      case 'ADVANCE_KYC_COMPLETED':
        return KycStatus.BASIC_COMPLETED;
      case 'EDD_COMPLETED':
        return KycStatus.ADVANCED_COMPLETED;
      case 'TEMPORARY_FAILURE':
        return KycStatus.TEMP_FAILURE;
      case 'PERMANENT_FAILURE':
        return KycStatus.PERMANENT_FAILURE;
      default:
        return KycStatus.IN_PROGRESS;
    }
  }
}
