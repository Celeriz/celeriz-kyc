import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { CreateOrGetUserDto } from './dto/user.dto';

@Controller('user')
@UseGuards(ApiKeyGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createOrGetUser(@Body() dto: CreateOrGetUserDto) {
    return this.userService.createOrGetUser(dto);
  }
}
