import { KYCStatus, UserRole } from '@repo/db';

export type AuthenticatedUser = {
  id: string;
  email: string;
  phone: string;
  isActive: boolean;
  role: UserRole;
  kycStatus: KYCStatus;
};
