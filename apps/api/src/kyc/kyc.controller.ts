import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentClient } from 'src/common/decorators/client.decorator';
import { AuthClient } from 'src/types/client.types';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { StartKycResponseDto } from './dto/kyc-response.dto';

@Controller('kyc')
@UseGuards(ApiKeyGuard)
@ApiTags('Users')
@ApiSecurity('X-API-KEY')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  // @Get('url')
  // @ApiOperation({
  //   summary: 'Get KYC URL for user verification',
  //   description: 'Generate a KYC verification URL for a specific user',
  // })
  // async getKycUrl(user: AuthenticatedUser) {
  //   return this.kycService.getKycUrl(user);
  // }

  // @Get('status')
  // @ApiOperation({
  //   summary: 'Get KYC verification status',
  //   description: 'Generate KYC verification status for a specific user',
  // })
  // getKycStatus(user: AuthenticatedUser) {
  //   return this.kycService.getUserKycStatus(user);
  // }

  @Get('start/:clientUserId')
  @ApiOperation({ summary: 'Start KYC process' })
  @ApiResponse({ status: HttpStatus.OK, type: StartKycResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API key',
  })
  startKycProcess(
    @CurrentClient() client: AuthClient,
    @Param('clientUserId') clientUserId: string,
  ) {
    return this.kycService.startKyc(client.id, clientUserId);
  }
}
