import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Attach the roles allowed to access a controller or route handler. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
