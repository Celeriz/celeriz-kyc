import { BadRequestException } from '@nestjs/common';

export function formatPhoneNumber(phone: string): string {
  if (!phone.startsWith('+') || phone.length < 4) {
    throw new BadRequestException('Invalid phone number format');
  }

  const countryCode = phone.slice(0, 3); // e.g. "+91"
  const number = phone.slice(3); // e.g. "8080808080"

  return `${countryCode}-${number}`;
}
