import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KycStatus, prisma } from '@repo/db';
import { OnrampMoneyKycStatus } from 'src/types/onramp-money.types';
import {
  getOnrampMoneyKycStatus,
  getOnrampMoneyKycUrl,
} from 'src/apis/onramp-money/kyc';
import { StartKycResponseDto } from './dto/kyc-response.dto';

@Injectable()
export class KycService {
  constructor() {}

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
      email: clientUser.user.email,
      clientCustomerId: clientUser.clientUserId,
      phoneNumber: clientUser.user.phone,
      type: 'INDIVIDUAL',
      customerId: clientUser.providerCustomerId || undefined,
    });

    let customerId: string | null = null;
    let kycUrl: string | null = null;

    if (onrampKycData.type === 'NEW_CUSTOMER') {
      customerId = onrampKycData.customerId;
      kycUrl = onrampKycData.kycUrl;
    }

    // Customer already registered, fetch URL using customerId
    if (onrampKycData.type === 'EXISTING_CUSTOMER') {
      // Pass customer ID to get existing KYC URL
      const onrampKycDataExisting = await getOnrampMoneyKycUrl({
        email: clientUser.user.email,
        clientCustomerId: clientUser.clientUserId,
        phoneNumber: clientUser.user.phone,
        type: 'INDIVIDUAL',
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

    const onrampMoneyKycStatus = await getOnrampMoneyKycStatus(customerId);
    let newKycStatus: KycStatus = KycStatus.IN_PROGRESS;

    // Get status if the customer already existed
    if (onrampKycData.type === 'EXISTING_CUSTOMER') {
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
