import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateOrGetUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor() {}

  async createOrGetUser(dto: CreateOrGetUserDto) {
    const { clientId, email, phone, clientUserId } = dto;

    // First, find or create the user
    const user = await prisma.user.upsert({
      where: { email },
      update: { phone },
      create: { email, phone },
    });

    // Then, create or get the client-user relationship
    const clientUser = await prisma.clientUser.upsert({
      where: {
        clientId_clientUserId: { clientId, clientUserId },
      },
      update: {},
      create: {
        clientId,
        userId: user.id,
        clientUserId,
      },
    });

    return clientUser;
  }
}
