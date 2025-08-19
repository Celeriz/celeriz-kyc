import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthClient } from 'src/types/client.types';

export const CurrentClient = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.client as AuthClient;
  },
);
