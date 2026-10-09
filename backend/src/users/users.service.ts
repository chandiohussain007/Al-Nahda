import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface UpsertUserInput {
  email: string;
  googleId: string;
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
    return this.configuredEmails('ADMIN_EMAILS').includes(email.trim().toLowerCase());
  }

  private isTeacherEmail(email: string): boolean {
    // Teacher role assignment is server-controlled and never comes from the client.
    return this.configuredEmails('TEACHER_EMAILS').includes(email.trim().toLowerCase());
  }

  private configuredEmails(key: string): string[] {
    return (this.configService.get<string>(key) ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0);
  }

  async upsertFromGoogle(input: UpsertUserInput): Promise<User> {
    const isAdmin = this.isAdminEmail(input.email);
    const isTeacher = this.isTeacherEmail(input.email);
    const role = isAdmin ? UserRole.ADMIN : isTeacher ? UserRole.TEACHER : UserRole.STUDENT;

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: input.googleId }, { email: input.email }] },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: { email: input.email, googleId: input.googleId, role },
      });
    }

    return this.prisma.user.create({
      data: {
        email: input.email,
        googleId: input.googleId,
        role,
      },
    });
  }
}
