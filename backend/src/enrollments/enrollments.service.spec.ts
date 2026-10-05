import { Test } from '@nestjs/testing';
import { Course, Level, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentsService } from '../students/students.service.js';
import { TeachersService } from '../teachers/teachers.service.js';
import { EnrollmentsService } from './enrollments.service.js';

const prismaMock = {
  teacherProfile: { findUnique: vi.fn() },
  evaluationTest: { findUnique: vi.fn() },
  enrollment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
};

const studentsServiceMock = { getProfile: vi.fn() };
const teachersServiceMock = { getProfile: vi.fn() };
const notificationsServiceMock = { create: vi.fn() };

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StudentsService, useValue: studentsServiceMock },
        { provide: TeachersService, useValue: teachersServiceMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = moduleRef.get(EnrollmentsService);
  });

  it('creates a pending enrollment and notifies the teacher', async () => {
    studentsServiceMock.getProfile.mockResolvedValue({
      id: 'student-1',
      userId: 'user-1',
      fullName: 'Aisha',
    });
    prismaMock.teacherProfile.findUnique.mockResolvedValue({
      id: 'teacher-1',
      userId: 'user-2',
    });
    prismaMock.enrollment.create.mockResolvedValue({ id: 'enr-1' });

    await service.create('user-1', {
      teacherId: 'teacher-1',
      courseName: Course.LEARN_QURAN,
      preferredTimeSlot: 'Mon/Wed 18:00',
      confirmedLevel: Level.BEGINNER,
    });

    expect(prismaMock.enrollment.create).toHaveBeenCalledTimes(1);
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-2', senderId: 'user-1' }),
    );
  });

  it('denies access to an enrollment the user is not part of', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      student: { userId: 'someone-else' },
      teacher: { userId: 'someone-else-2' },
    });

    await expect(service.getById('user-1', UserRole.STUDENT, 'enr-1')).rejects.toThrow(
      'You do not have access to this enrollment',
    );
  });

  it('lets the owning teacher accept a pending enrollment and notifies the student', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1', userId: 'user-2' });
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      teacherId: 'teacher-1',
      status: 'PENDING',
      courseName: 'LEARN_QURAN',
      preferredTimeSlot: 'Mon/Wed 18:00',
      student: { userId: 'user-1', fullName: 'Aisha' },
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'enr-1', status: 'ACTIVE' });

    const result = await service.teacherResolve('user-2', 'enr-1', true);

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'enr-1' },
        data: { status: 'ACTIVE' },
      }),
    );
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'user-1', senderId: 'user-2' }),
    );
    expect(result.status).toBe('ACTIVE');
  });

  it('lets the owning teacher reject a pending enrollment', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1', userId: 'user-2' });
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      teacherId: 'teacher-1',
      status: 'PENDING',
      courseName: 'LEARN_ARABIC',
      preferredTimeSlot: 'Sat 10:00',
      student: { userId: 'user-1', fullName: 'Aisha' },
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'enr-1', status: 'CANCELLED' });

    await service.teacherResolve('user-2', 'enr-1', false);

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CANCELLED' } }),
    );
  });

  it('refuses when the teacher does not own the enrollment', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1', userId: 'user-2' });
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      teacherId: 'someone-else',
      status: 'PENDING',
      student: { userId: 'user-1' },
    });

    await expect(service.teacherResolve('user-2', 'enr-1', true)).rejects.toThrow(
      'You can only manage your own enrollments',
    );
    expect(prismaMock.enrollment.update).not.toHaveBeenCalled();
  });

  it('refuses to act on an enrollment that is no longer pending', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1', userId: 'user-2' });
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'enr-1',
      teacherId: 'teacher-1',
      status: 'ACTIVE',
      student: { userId: 'user-1' },
    });

    await expect(service.teacherResolve('user-2', 'enr-1', true)).rejects.toThrow(
      'Enrollment is already ACTIVE',
    );
    expect(prismaMock.enrollment.update).not.toHaveBeenCalled();
  });

  it('404s when the enrollment does not exist', async () => {
    teachersServiceMock.getProfile.mockResolvedValue({ id: 'teacher-1', userId: 'user-2' });
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(service.teacherResolve('user-2', 'missing', true)).rejects.toThrow(
      'Enrollment not found',
    );
  });
});
