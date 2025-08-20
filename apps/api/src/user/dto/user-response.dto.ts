import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user in the system',
  })
  userId: string;

  @ApiProperty({
    description: 'Unique identifier for the user in the client system',
  })
  clientUserId: string;

  @ApiProperty({
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    description: 'Phone number in format +{CountryCode}{10-digit phone number}',
  })
  phone: string;
}
