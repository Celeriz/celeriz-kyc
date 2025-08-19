import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class StartKycDto {
  @IsString()
  @ApiProperty()
  clientUserId: string;
}
