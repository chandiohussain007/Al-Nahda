import { UserRole } from '@prisma/client';

/** Shape of the JWT payload attached to `request.user` by {@link JwtAuthGuard}. */
export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: UserRole;
}
