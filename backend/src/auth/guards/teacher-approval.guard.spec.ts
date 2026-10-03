import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { TeacherStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TeacherApprovalGuard } from './teacher-approval.guard.js';

const prismaMock = { teacherProfile: { findUnique: vi.fn() } };

function contextFor(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('TeacherApprovalGuard', () => {
  let guard: TeacherApprovalGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new TeacherApprovalGuard(prismaMock as unknown as PrismaService);
  });

  it('allows an approved teacher', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({
      teacherStatus: TeacherStatus.APPROVED,
    });

    await expect(
      guard.canActivate(contextFor({ sub: 'u1', role: UserRole.TEACHER })),
    ).resolves.toBe(true);
  });

  it('blocks a pending teacher', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({
      teacherStatus: TeacherStatus.PENDING,
    });

    await expect(
      guard.canActivate(contextFor({ sub: 'u1', role: UserRole.TEACHER })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets admins and students through without a teacher lookup', async () => {
    await expect(
      guard.canActivate(contextFor({ sub: 'a', role: UserRole.ADMIN })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(contextFor({ sub: 's', role: UserRole.STUDENT })),
    ).resolves.toBe(true);

    expect(prismaMock.teacherProfile.findUnique).not.toHaveBeenCalled();
  });
});
