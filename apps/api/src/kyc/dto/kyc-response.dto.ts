import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '@repo/db';

export class StartKycResponseDto {
  @ApiProperty()
  clientUserId: string;

  @ApiProperty()
  kycId: string;

  @ApiProperty()
  kycLink: string;

  @ApiProperty({
    enum: KycStatus,
  })
  kycStatus: KycStatus;
}

export class KycStatusResponseDto {
  @ApiProperty()
  clientUserId: string;

  @ApiProperty()
  kycId: string;

  @ApiProperty()
  kycLink: string;

  @ApiProperty({
    enum: KycStatus,
  })
  kycStatus: KycStatus;
}
