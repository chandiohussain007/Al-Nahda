import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CourseStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminService } from './admin.service.js';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  courseItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

describe('AdminService course management', () => {
  let service: AdminService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(AdminService);
  });

  describe('AdminService account controls', () => {
    let service: AdminService;

    beforeEach(async () => {
      vi.clearAllMocks();
      const moduleRef = await Test.createTestingModule({
        providers: [
          AdminService,
          { provide: PrismaService, useValue: prismaMock },
          { provide: NotificationsService, useValue: {} },
        ],
      }).compile();
      service = moduleRef.get(AdminService);
    });

    it('deactivates a non-admin account without deleting its records', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        role: 'STUDENT',
        isActive: true,
      });
      prismaMock.user.update.mockResolvedValue({
        id: 'student-1',
        email: 'student@example.com',
        role: 'STUDENT',
        isActive: false,
        createdAt: new Date(),
      });

      await service.setUserActive('student-1', false, 'admin-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          isActive: true,
        },
      });
    });

    it('prevents deactivating the current admin or another administrator', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        isActive: true,
      });
      await expect(service.setUserActive('admin-1', false, 'admin-1')).rejects.toThrow(
        'You cannot deactivate your own account',
      );
      await expect(service.setUserActive('admin-1', false, 'admin-2')).rejects.toThrow(
        'Administrator accounts cannot be deactivated',
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('restores an inactive user account', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        role: 'STUDENT',
        isActive: false,
      });
      prismaMock.user.update.mockResolvedValue({
        id: 'student-1',
        isActive: true,
      });

      await service.setUserActive('student-1', true, 'admin-1');

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
    });
  });

  it('lists all courses in status and creation order for the admin catalog', async () => {
    prismaMock.courseItem.findMany.mockResolvedValue([{ id: 'course-1' }]);

    await expect(service.listCourses()).resolves.toEqual([{ id: 'course-1' }]);
    expect(prismaMock.courseItem.findMany).toHaveBeenCalledWith({
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  });

  it('creates courses with safe empty defaults', async () => {
    const dto = { name: 'Quran Reading', slug: 'quran-reading' };
    prismaMock.courseItem.create.mockResolvedValue({ id: 'course-1', ...dto });

    await service.createCourse(dto);

    expect(prismaMock.courseItem.create).toHaveBeenCalledWith({
      data: {
        ...dto,
        description: null,
        standardFee: null,
      },
    });
  });

  it('updates existing courses and rejects unknown ids', async () => {
    prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'course-1' });
    prismaMock.courseItem.update.mockResolvedValue({ id: 'course-1', name: 'Updated' });
    await expect(service.updateCourse('course-1', { name: 'Updated' })).resolves.toMatchObject({
      name: 'Updated',
    });
    expect(prismaMock.courseItem.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { name: 'Updated' },
    });

    prismaMock.courseItem.findUnique.mockResolvedValue(null);
    await expect(service.updateCourse('missing', { name: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.courseItem.update).toHaveBeenCalledTimes(1);
  });

  it('archives instead of hard-deleting courses and preserves related records', async () => {
    prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'course-1' });
    prismaMock.courseItem.update.mockResolvedValue({
      id: 'course-1',
      status: CourseStatus.ARCHIVED,
    });

    await expect(service.archiveCourse('course-1')).resolves.toMatchObject({
      status: CourseStatus.ARCHIVED,
    });
    expect(prismaMock.courseItem.update).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      data: { status: CourseStatus.ARCHIVED },
    });
  });
});
