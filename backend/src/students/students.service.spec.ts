import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentsService } from './students.service.js';

const prismaMock = {
  studentProfile: { findUnique: vi.fn(), upsert: vi.fn() },
  enrollment: { findMany: vi.fn() },
  evaluationTest: { findMany: vi.fn() },
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [StudentsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(StudentsService);
  });

  it('throws when the student profile does not exist', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('upserts the profile for the current user', async () => {
    prismaMock.studentProfile.upsert.mockResolvedValue({ id: 'student-1' });

    await service.upsertProfile('user-1', { fullName: 'Aisha' });

    expect(prismaMock.studentProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', fullName: 'Aisha' },
      update: { fullName: 'Aisha' },
    });
  });

  it('computes the attendance rate from enrollment records', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'student-1',
      fullName: 'Aisha',
    });
    prismaMock.enrollment.findMany.mockResolvedValue([
      {
        id: 'enr-1',
        courseName: 'LEARN_QURAN',
        confirmedLevel: 'BEGINNER',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        teacher: { id: 'teacher-1', fullName: 'Sheikh Yusuf' },
        attendance: [{ status: 'PRESENT' }, { status: 'PRESENT' }, { status: 'ABSENT' }],
      },
    ]);
    prismaMock.evaluationTest.findMany.mockResolvedValue([]);

    const progress = await service.getProgress('user-1');

    expect(progress.totalEnrollments).toBe(1);
    expect(progress.activeEnrollments).toBe(1);
    expect(progress.attendance).toMatchObject({
      PRESENT: 2,
      ABSENT: 1,
      EXCUSED: 0,
      totalSessions: 3,
      attendanceRate: 67,
    });
  });
});
