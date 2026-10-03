import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/** Extracts the authenticated user (the verified JWT payload) from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user as AuthenticatedUser;
  },
);
