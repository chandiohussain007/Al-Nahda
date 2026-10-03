import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await this.jwtService.verifyAsync<AuthenticatedUser>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }
}
