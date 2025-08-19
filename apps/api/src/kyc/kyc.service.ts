import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { KYCStatus, prisma } from '@repo/db';
import { OnrampMoneyKycStatus } from 'src/types/onramp-money.types';
import {
  getOnrampMoneyKycStatus,
  getOnrampMoneyKycUrl,
} from 'src/apis/onramp-money/kyc';
import { AuthenticatedUser } from 'src/types/user.types';

@Injectable()
export class KycService {
  constructor() {}

  async getKycUrl(user: AuthenticatedUser): Promise<{
    userId: string;
    kycStatus: KYCStatus;
    kycUrl: string;
    kycId: string;
  }> {
    // try {
    const kycData = await prisma.kYC.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!kycData) {
      throw new BadRequestException(
        'KYC data not found for user, please contact support',
      );
    }

    if (kycData.kycStatus === KYCStatus.NOT_STARTED) {
      throw new BadRequestException(
        'KYC process has not been started for this user',
      );
    }

    if (!kycData.kycUrl) {
      throw new BadRequestException(
        'KYC URL not available, please start the KYC process',
      );
    }

    return {
      userId: user.id,
      kycStatus: kycData.kycStatus,
      kycUrl: kycData.kycUrl,
      kycId: kycData.kycId!,
    };
    // } catch (error: any) {
    //   if (axios.isAxiosError(error)) {
    //     console.log(error.response?.data);
    //   }

    //   throw new Error(
    //     `Failed to get KYC URL: ${(error as Error).message || 'Unknown error'}`,
    //   );
    // }
  }

  async getUserKycStatus(user: AuthenticatedUser): Promise<{
    userId: string;
    status: KYCStatus;
    kycId: string | null;
    kycLink: string | null;
  }> {
    const kycData = await prisma.kYC.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!kycData) {
      throw new InternalServerErrorException('KYC data not found for user');
    }

    return {
      userId: user.id,
      status: kycData.kycStatus,
      kycId: kycData.kycId,
      kycLink: kycData.kycUrl,
    };
  }

  async startKycProcess(user: AuthenticatedUser): Promise<{
    userId: string;
    status: KYCStatus;
    kycId: string;
    kycLink: string;
  }> {
    const userKycData = await prisma.kYC.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (userKycData?.kycStatus !== KYCStatus.NOT_STARTED) {
      throw new BadRequestException(
        'KYC process already started or completed for this user',
      );
    }

    const onrampKycData = await getOnrampMoneyKycUrl({
      clientCustomerId: user.id,
      email: user.email,
      phoneNumber: user.phone,
      type: 'INDIVIDUAL',
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
        clientCustomerId: user.id,
        email: user.email,
        phoneNumber: user.phone,
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
      throw new InternalServerErrorException(
        'Failed to get KYC URL or customer ID from external service',
      );
    }

    const onrampMoneyKycStatus = await getOnrampMoneyKycStatus(customerId);
    let newKycStatus: KYCStatus = KYCStatus.IN_PROGRESS;

    // Get status if the customer already existed
    if (onrampKycData.type === 'EXISTING_CUSTOMER') {
      newKycStatus = KycService.onrampMoneyStatusToKYCStatus(
        onrampMoneyKycStatus.status,
      );
    }

    const updatedKycData = await prisma.kYC.update({
      where: {
        id: userKycData.id,
      },
      data: {
        kycId: customerId,
        kycUrl: kycUrl,
        kycStatus: newKycStatus,
        kycProvider: 'onramp.money',
      },
    });

    return {
      userId: user.id,
      kycId: updatedKycData.kycId!,
      kycLink: updatedKycData.kycUrl!,
      status: updatedKycData.kycStatus,
    };
  }

  async updateKycStatusByUserId(
    userId: string,
    status: OnrampMoneyKycStatus,
  ): Promise<{
    userId: string;
    kycId: string;
    status: OnrampMoneyKycStatus;
  }> {
    try {
      const kycData = await prisma.kYC.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!kycData) {
        throw new InternalServerErrorException(
          'KYC data not found, please contact support',
        );
      }

      // TODO: Handle failure status (store failure reason)
      const newKycStatus: KYCStatus =
        KycService.onrampMoneyStatusToKYCStatus(status);

      await prisma.kYC.update({
        where: {
          id: kycData.id,
        },
        data: {
          kycStatus: newKycStatus,
        },
      });

      return {
        userId: userId,
        kycId: kycData.kycId!,
        status,
      };
    } catch (error) {
      throw new Error(
        `Failed to update KYC status: ${(error as Error).message || 'Unknown error'}`,
      );
    }
  }

  private static onrampMoneyStatusToKYCStatus(
    onrampMoneyStatus: OnrampMoneyKycStatus,
  ): KYCStatus {
    switch (onrampMoneyStatus) {
      case 'OTP_COMPLETED':
      case 'IN_REVIEW':
        return KYCStatus.IN_PROGRESS;
      case 'COMPLETED':
      case 'BASIC_KYC_COMPLETED':
      case 'INTERMEDIATE_KYC_COMPLETED':
      case 'ADVANCE_KYC_COMPLETED':
        return KYCStatus.BASIC_COMPLETED;
      case 'EDD_COMPLETED':
        return KYCStatus.ADVANCED_COMPLETED;
      case 'TEMPORARY_FAILURE':
        return KYCStatus.TEMP_FAILURE;
      case 'PERMANENT_FAILURE':
        return KYCStatus.PERMANENT_FAILURE;
      default:
        return KYCStatus.IN_PROGRESS;
    }
  }
}
