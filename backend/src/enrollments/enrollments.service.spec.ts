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
  enrollment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
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
});
