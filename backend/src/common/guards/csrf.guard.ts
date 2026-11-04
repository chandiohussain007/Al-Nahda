import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/** Metadata key used to skip CSRF on specific routes (e.g. public endpoints). */
export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Double-submit CSRF guard.
 *
 * The frontend receives a `csrf-token` cookie (readable by JS, non-httpOnly)
 * on every auth refresh response. For all state-changing requests it must
 * mirror that value in the `X-CSRF-Token` header.
 *
 * GET / HEAD / OPTIONS requests are always allowed — they must not have
 * side-effects.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) return true;

    // Requests carrying a Bearer token in the Authorization header are SPA API
    // calls authenticated explicitly by client JavaScript, making them immune to
    // ambient-credential CSRF browser attacks.
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return true;
    }

    const cookieToken = (req.cookies as Record<string, string>)?.['csrf-token'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }
}
