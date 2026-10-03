import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface UpsertUserInput {
  email: string;
  googleId: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * Emails listed in the comma-separated `ADMIN_EMAILS` environment variable are
   * platform administrators. This is the only way an ADMIN account is created,
   * so a client can never request admin access through Google login.
   */
  isAdminEmail(email: string): boolean {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);

    return adminEmails.includes(email.trim().toLowerCase());
  }

  async upsertFromGoogle(input: UpsertUserInput): Promise<User> {
    const requestedRole = this.resolveRequestedRole(input.role);
    const isAdmin = this.isAdminEmail(input.email);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: input.googleId }, { email: input.email }] },
    });

    if (existing) {
      // Existing roles are preserved to prevent self-escalation. The only
      // exception is granting ADMIN to an email in ADMIN_EMAILS.
      const role = isAdmin ? UserRole.ADMIN : existing.role;

      return this.prisma.user.update({
        where: { id: existing.id },
        data: { email: input.email, googleId: input.googleId, role },
      });
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        googleId: input.googleId,
        role: isAdmin ? UserRole.ADMIN : requestedRole,
      },
    });
  }

  private resolveRequestedRole(role?: UserRole): UserRole {
    // ADMIN can never be requested by a client.
    return role === UserRole.TEACHER ? UserRole.TEACHER : UserRole.STUDENT;
  }
}
