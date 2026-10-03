import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { TeachersService } from '../teachers/teachers.service.js';
import { AttendanceService } from './attendance.service.js';

const prismaMock = {
  enrollment: { findUnique: vi.fn() },
  attendance: { upsert: vi.fn(), findMany: vi.fn() },
};

const teachersServiceMock = { getProfile: vi.fn() };

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TeachersService, useValue: teachersServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AttendanceService);
  });

  it('prevents a teacher from recording attendance for another teacher class', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1' });
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1', teacherId: 'teacher-2' });

    await expect(
      service.record('user-1', {
        enrollmentId: 'enr-1',
        date: '2026-03-10T00:00:00.000Z',
        status: 'PRESENT',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaMock.attendance.upsert).not.toHaveBeenCalled();
  });

  it('upserts attendance for the owning teacher', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1' });
    prismaMock.enrollment.findUnique.mockResolvedValue({ id: 'enr-1', teacherId: 'teacher-1' });
    prismaMock.attendance.upsert.mockResolvedValue({ id: 'att-1' });

    await service.record('user-1', {
      enrollmentId: 'enr-1',
      date: '2026-03-10T00:00:00.000Z',
      status: 'PRESENT',
    });

    expect(prismaMock.attendance.upsert).toHaveBeenCalledTimes(1);
  });
});
