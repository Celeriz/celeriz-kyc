import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class CreateOrGetUserDto {
  @IsString()
  @IsEmail()
  @ApiProperty({
    description: 'Email address of the user',
  })
  email: string;

  @IsString()
  @IsPhoneNumber()
  @ApiProperty({
    example: '+911234567890',
    description: 'Phone number in format +{CountryCode}{10-digit phone number}',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique identifier for the user in the client system',
  })
  clientUserId: string;
}
