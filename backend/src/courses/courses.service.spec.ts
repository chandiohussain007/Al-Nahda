import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoursesService } from './courses.service.js';

const prismaMock = {
  courseItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  levelContent: {
    findMany: vi.fn(),
  },
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(CoursesService);
  });

  describe('findAll', () => {
    it('returns only published courses, oldest first', async () => {
      prismaMock.courseItem.findMany.mockResolvedValue([{ id: 'c1' }]);

      const result = await service.findAll();

      expect(result).toEqual([{ id: 'c1' }]);
      expect(prismaMock.courseItem.findMany).toHaveBeenCalledWith({
        where: { status: CourseStatus.PUBLISHED },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('findLevels', () => {
    it('returns the levels of a course ordered by sortOrder', async () => {
      prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'c1' });
      prismaMock.levelContent.findMany.mockResolvedValue([
        { id: 'l1', sortOrder: 0 },
        { id: 'l2', sortOrder: 1 },
      ]);

      const result = await service.findLevels('c1');

      expect(result).toHaveLength(2);
      expect(prismaMock.levelContent.findMany).toHaveBeenCalledWith({
        where: { courseId: 'c1' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('404s when the course does not exist', async () => {
      prismaMock.courseItem.findUnique.mockResolvedValue(null);

      await expect(service.findLevels('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.levelContent.findMany).not.toHaveBeenCalled();
    });
  });
});
