import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TeacherStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/**
 * Ensures a TEACHER can only reach teacher features once an administrator has
 * approved their application (`teacherStatus = APPROVED`). Admins and students
 * pass through untouched and are handled by {@link RolesGuard}.
 */
@Injectable()
export class TeacherApprovalGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || user.role !== UserRole.TEACHER) {
      return true;
    }

    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.sub },
      select: { teacherStatus: true },
    });

    if (!profile || profile.teacherStatus !== TeacherStatus.APPROVED) {
      throw new ForbiddenException('Teacher account is pending administrator approval');
    }

    return true;
  }
}
