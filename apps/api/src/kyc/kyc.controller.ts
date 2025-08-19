import { Controller, Get, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service';
import {
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
@ApiTags('KYC')
@ApiSecurity('X-API-KEY')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status/:clientUserId')
  @ApiOperation({ summary: 'Get KYC verification status' })
  @ApiResponse({ status: HttpStatus.OK, type: StartKycResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API key',
  })
  getKycStatus(
    @CurrentClient() client: AuthClient,
    @Param('clientUserId') clientUserId: string,
  ) {
    return this.kycService.getKycStatusByClientUserId(client.id, clientUserId);
  }

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
