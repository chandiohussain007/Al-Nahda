import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TeachersService } from './teachers.service.js';

const prismaMock = {
  teacherProfile: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
};

const notificationsMock = { create: vi.fn() };

describe('TeachersService', () => {
  let service: TeachersService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsMock },
      ],
    }).compile();

    service = moduleRef.get(TeachersService);
  });

  it('throws when the teacher profile does not exist', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only approved teachers and never selects the linked user', async () => {
    prismaMock.teacherProfile.findMany.mockResolvedValue([
      { id: 'teacher-1', fullName: 'Sheikh Yusuf' },
    ]);

    const teachers = await service.listApproved();

    expect(prismaMock.teacherProfile.findMany).toHaveBeenCalledWith({
      where: { teacherStatus: 'APPROVED' },
      select: {
        id: true,
        fullName: true,
        profilePictureUrl: true,
        bio: true,
        qualifications: true,
        experienceYears: true,
        subjectsTaught: true,
      },
      orderBy: { fullName: 'asc' },
    });
    expect(teachers).toHaveLength(1);
    expect(teachers[0]).not.toHaveProperty('user');
  });

  it('upserts the profile for the current user', async () => {
    prismaMock.teacherProfile.upsert.mockResolvedValue({ id: 'teacher-1' });

    const dto = {
      fullName: 'Sheikh Yusuf',
      qualifications: ['Ijazah in Hafs'],
      experienceYears: 8,
      subjectsTaught: ['LEARN_QURAN'],
    };

    await service.upsertProfile('user-1', dto);

    expect(prismaMock.teacherProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', ...dto },
      update: { ...dto },
    });
  });
});
