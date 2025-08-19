import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  clientUserId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;
}
