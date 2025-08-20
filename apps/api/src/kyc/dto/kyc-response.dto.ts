import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KycStatus } from '@repo/db';

export class StartKycResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user in the client system',
  })
  clientUserId: string;

  @ApiProperty({
    description: 'Unique identifier for the KYC session',
  })
  kycId: string;

  @ApiPropertyOptional({
    description:
      'Link to the KYC verification page (can be empty if KycStatus is NOT_STARTED)',
    example: 'https://kyc.celeriz.com/sessionId=12345',
  })
  kycLink: string;

  @ApiProperty({
    enum: KycStatus,
    description: 'Current status of the KYC verification process',
  })
  kycStatus: KycStatus;
}

export class KycStatusResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user in the client system',
  })
  clientUserId: string;

  @ApiProperty({
    description: 'Unique identifier for the KYC session',
  })
  kycId: string;

  @ApiPropertyOptional({
    description:
      'Link to the KYC verification page (can be empty if KycStatus is NOT_STARTED)',
    example: 'https://kyc.celeriz.com/sessionId=12345',
  })
  @ApiProperty()
  kycLink: string;

  @ApiProperty({
    enum: KycStatus,
    description: 'Current status of the KYC verification process',
  })
  kycStatus: KycStatus;
}
