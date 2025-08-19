import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { prisma } from '@repo/db';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const client = await prisma.client.findUnique({
      where: { apiKey, isActive: true },
    });

    if (!client) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.client = client; // Attach client to request
    return true;
  }
}
