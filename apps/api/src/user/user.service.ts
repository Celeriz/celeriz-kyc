import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateOrGetUserDto } from './dto/user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor() {}

  async createOrGetUser(
    clientId: string,
    dto: CreateOrGetUserDto,
  ): Promise<UserResponseDto> {
    const { email, phone, clientUserId } = dto;

    // First, find or create the user
    const user = await prisma.user.upsert({
      where: { email },
      update: { phone },
      create: {
        email,
        phone,
        kycSession: {
          create: {
            status: 'NOT_STARTED',
            initiatedByClientId: clientId,
          },
        },
      },
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

    return {
      userId: user.id,
      clientUserId: clientUser.clientUserId,
      email: user.email,
      phone: user.phone,
    };
  }

  async getUserByClientUserId(
    clientId: string,
    clientUserId: string,
  ): Promise<UserResponseDto | null> {
    const clientUser = await prisma.clientUser.findUnique({
      where: {
        clientId_clientUserId: { clientId, clientUserId },
      },
      include: { user: true },
    });

    if (!clientUser) {
      throw new NotFoundException(
        `User with this clientUserId (${clientUserId}) not found`,
      );
    }

    const { user } = clientUser;

    return {
      userId: user.id,
      clientUserId: clientUser.clientUserId,
      email: user.email,
      phone: user.phone,
    };
  }
}
