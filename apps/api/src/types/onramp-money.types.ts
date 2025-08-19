/******************** KYC ********************/

export type OnrampMoneyKycStep =
  | 'BASIC_KYC'
  | 'INTERMEDIATE_KYC'
  | 'ADVANCE_KYC'
  | 'VIDEO_KYC'
  | 'EDD';

export type OnrampMoneyKycStatus =
  | 'OTP_COMPLETED'
  | 'COMPLETED'
  | 'BASIC_KYC_COMPLETED'
  | 'INTERMEDIATE_KYC_COMPLETED'
  | 'ADVANCE_KYC_COMPLETED'
  | 'EDD_COMPLETED' // Enhanced Due Diligence, noted as for INDIA only
  | 'IN_REVIEW'
  | 'PERMANENT_FAILURE'
  | 'TEMPORARY_FAILURE';
