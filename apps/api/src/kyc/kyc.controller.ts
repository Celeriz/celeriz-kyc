import { Controller, Get } from '@nestjs/common';
import { KycService } from './kyc.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/types/user.types';

@Controller('kyc')
@ApiBearerAuth()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('url')
  @ApiOperation({
    summary: 'Get KYC URL for user verification',
    description: 'Generate a KYC verification URL for a specific user',
  })
  async getKycUrl(user: AuthenticatedUser) {
    return this.kycService.getKycUrl(user);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get KYC verification status',
    description: 'Generate KYC verification status for a specific user',
  })
  getKycStatus(user: AuthenticatedUser) {
    return this.kycService.getUserKycStatus(user);
  }

  @Get('start')
  @ApiOperation({
    summary: 'Start KYC process',
  })
  startKycProcess(user: AuthenticatedUser) {
    return this.kycService.startKycProcess(user);
  }
}
