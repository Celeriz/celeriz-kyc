import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { CreateOrGetUserDto } from './dto/user.dto';
import {
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentClient } from 'src/common/decorators/client.decorator';
import { AuthClient } from 'src/types/client.types';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('user')
@UseGuards(ApiKeyGuard)
@ApiTags('Users')
@ApiSecurity('api_key')
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for authentication',
  required: true,
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create or get user' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API key',
  })
  async createOrGetUser(
    @CurrentClient() client: AuthClient,
    @Body() dto: CreateOrGetUserDto,
  ) {
    return this.userService.createOrGetUser(client.id, dto);
  }

  @Get(':clientUserId')
  @ApiOperation({ summary: 'Get user by client user ID' })
  @ApiResponse({ status: HttpStatus.OK, type: UserResponseDto })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid API key',
  })
  async(
    @CurrentClient() client: AuthClient,
    @Param('clientUserId') clientUserId: string,
  ) {
    return this.userService.getUserByClientUserId(client.id, clientUserId);
  }
}
