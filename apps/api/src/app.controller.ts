import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { ApiSecurity } from '@nestjs/swagger';
import { CurrentClient } from './common/decorators/client.decorator';
import { AuthClient } from './types/client.types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('client')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('X-API-KEY')
  getCurrentClient(@CurrentClient() client: AuthClient) {
    return {
      clientId: client.id,
      clientName: client.name,
      isActive: client.isActive,
    };
  }
}
