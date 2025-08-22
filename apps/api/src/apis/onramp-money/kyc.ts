import { BadGatewayException, BadRequestException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import onrampApi from 'src/config/axios';
import {
  OnrampMoneyKycStatus,
  OnrampMoneyKycStep,
} from 'src/types/onramp-money.types';
import { formatPhoneNumber } from 'src/utils/formatters';

/**
 * Returns customerId if KYC is already done
 * otherwise returns KYC URL and other details
 */
export async function getOnrampMoneyKycUrl(data: {
  clientCustomerId: string;
  phoneNumber: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  email: string;
  customerId?: string;
}): Promise<
  | {
      type: 'NEW_CUSTOMER';
      customerId: string;
      kycUrl: string;
      clientCustomerId: string;
      signature: string;
    }
  | {
      type: 'EXISTING_CUSTOMER';
      customerId: string;
    }
> {
  const { clientCustomerId, phoneNumber, type, email, customerId } = data;

  try {
    const response = await onrampApi.post<{
      status: number;
      code: number;
      data: {
        kycUrl: string;
        clientCustomerId: string;
        customerId: string;
        signature: string;
      };
    }>('/v2/whiteLabel/kyc/url', {
      clientCustomerId,
      phoneNumber: formatPhoneNumber(phoneNumber),
      type,
      email: email,
      customerId: customerId,
    });

    return {
      type: 'NEW_CUSTOMER',
      customerId: response.data.data.customerId,
      kycUrl: response.data.data.kycUrl,
      clientCustomerId: response.data.data.clientCustomerId,
      signature: response.data.data.signature,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        status: number;
        code: number;
        error: string;
        customerId?: string;
      }>;

      if (axiosError.response?.data.customerId) {
        const customerId = axiosError.response.data.customerId;

        return {
          type: 'EXISTING_CUSTOMER',
          customerId,
        };
      } else {
        throw new BadRequestException(
          `Failed to get KYC URL: ${axiosError.response?.data.error || 'Unknown error'}`,
        );
      }
    }

    throw new BadGatewayException(
      `Failed to get KYC URL: ${(error as Error).message || 'Unknown error'}`,
    );
  }
}

/**
 * Returns KYC Status
 */
export async function getOnrampMoneyKycStatus(customerId: string) {
  if (!customerId) {
    throw new BadRequestException('Customer ID is required to get KYC status');
  }

  try {
    const response = await onrampApi.post<{
      status: number;
      code: number;
      data: {
        status: OnrampMoneyKycStatus;
        countryISO: 'IN';
        currentKycVerificationStep: OnrampMoneyKycStep;
        previousSuccessfulKycStep: OnrampMoneyKycStep;
        failedReason?: string;
      };
    }>('/v2/whiteLabel/kyc/status', {
      customerId,
    });

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        status: number;
        code: number;
        error: string;
      }>;

      throw new BadRequestException(
        `Failed to get KYC Status: ${axiosError.response?.data.error || 'Unknown error'}`,
      );
    }

    throw new BadGatewayException(
      `Failed to get KYC URL: ${(error as Error).message || 'Unknown error'}`,
    );
  }
}
