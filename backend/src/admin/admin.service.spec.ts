import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentStatus, TeacherStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminService } from './admin.service.js';

const prismaMock = {
  teacherProfile: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  studentProfile: { findMany: vi.fn(), findUnique: vi.fn() },
  enrollment: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
};

const notificationsServiceMock = { create: vi.fn() };

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
  });

  it('approves a teacher and notifies them', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ id: 't1', userId: 'u1' });
    prismaMock.teacherProfile.update.mockResolvedValue({
      id: 't1',
      teacherStatus: TeacherStatus.APPROVED,
    });

    await service.setTeacherStatus('t1', TeacherStatus.APPROVED);

    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { teacherStatus: TeacherStatus.APPROVED },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'u1' }),
    );
  });

  it('throws for an unknown teacher', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.setTeacherStatus('missing', TeacherStatus.APPROVED),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('activates an enrollment and notifies both student and teacher', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      courseName: 'LEARN_QURAN',
      student: { userId: 'student-user' },
      teacher: { userId: 'teacher-user' },
    });
    prismaMock.enrollment.update.mockResolvedValue({
      id: 'e1',
      status: EnrollmentStatus.ACTIVE,
    });

    await service.setEnrollmentStatus('e1', EnrollmentStatus.ACTIVE);

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: EnrollmentStatus.ACTIVE },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'student-user' }),
    );
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'teacher-user' }),
    );
  });
});
