import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '@repo/db';
import { IsEnum } from 'class-validator';

export class ChangeKYCStatusDto {
  @ApiProperty({
    description: 'KYC Status to change to (anything other than NOT_STARTED)',
    enum: KycStatus,
  })
  @IsEnum(KycStatus)
  status: KycStatus;
}
