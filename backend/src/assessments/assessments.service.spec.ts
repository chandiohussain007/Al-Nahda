import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentsService } from './assessments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentStatus } from '@prisma/client';

describe('AssessmentsService', () => {
  let service: AssessmentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      assessment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      courseItem: {
        findUnique: vi.fn(),
      },
      levelContent: {
        findUnique: vi.fn(),
      },
      question: {
        findMany: vi.fn(),
      },
      assessmentQuestion: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  describe('create', () => {
    it('throws NotFoundException if course does not exist', async () => {
      prisma.courseItem.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'A1', courseId: 'c1', durationMinutes: 60 }, 'user1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if level does not exist', async () => {
      prisma.courseItem.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.levelContent.findUnique.mockResolvedValue(null);
      await expect(
        service.create({ title: 'A1', courseId: 'c1', levelId: 'l1', durationMinutes: 60 }, 'user1')
      ).rejects.toThrow(NotFoundException);
    });

    it('creates an assessment successfully', async () => {
      prisma.courseItem.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.assessment.create.mockResolvedValue({ id: 'a1' });

      const res = await service.create({ title: 'A1', courseId: 'c1', durationMinutes: 60 }, 'user1');

      expect(prisma.assessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'A1',
          courseId: 'c1',
          durationMinutes: 60,
          createdBy: 'user1',
          passPercentage: 60,
        }),
      });
      expect(res).toEqual({ id: 'a1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if assessment does not exist', async () => {
      prisma.assessment.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('throws BadRequestException if assessment has no questions', async () => {
      prisma.assessment.findUnique.mockResolvedValue({ id: 'a1', questions: [] });
      await expect(service.publish('a1')).rejects.toThrow(BadRequestException);
    });

    it('updates status to PUBLISHED', async () => {
      prisma.assessment.findUnique.mockResolvedValue({ id: 'a1', questions: [{ id: 'aq1' }] });
      prisma.assessment.update.mockResolvedValue({ id: 'a1', status: AssessmentStatus.PUBLISHED });

      const res = await service.publish('a1');
      expect(prisma.assessment.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: AssessmentStatus.PUBLISHED },
      });
      expect(res.status).toBe(AssessmentStatus.PUBLISHED);
    });

    it('includes assessment metadata and ordering in findAll queries', async () => {
      prisma.assessment.findMany.mockResolvedValue([]);

      await service.findAll({ skip: 10, take: 5 });

      expect(prisma.assessment.findMany).toHaveBeenCalledWith({
        include: {
          course: { select: { id: true, name: true, slug: true } },
          level: { select: { id: true, name: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 5,
      });
    });
  });

  describe('addQuestions', () => {
    it('throws NotFoundException if any question ID is missing', async () => {
      prisma.assessment.findUnique.mockResolvedValue({ id: 'a1', questions: [] });
      prisma.question.findMany.mockResolvedValue([{ id: 'q1' }]);

      await expect(service.addQuestions('a1', { questionIds: ['q1', 'q2'] })).rejects.toThrow(NotFoundException);
    });

    it('replaces questions correctly', async () => {
      prisma.assessment.findUnique.mockResolvedValue({ id: 'a1', questions: [] });
      prisma.question.findMany.mockResolvedValue([{ id: 'q1' }, { id: 'q2' }]);

      await service.addQuestions('a1', { questionIds: ['q1', 'q2'] });

      expect(prisma.assessmentQuestion.deleteMany).toHaveBeenCalledWith({ where: { assessmentId: 'a1' } });
      expect(prisma.assessmentQuestion.createMany).toHaveBeenCalledWith({
        data: [
          { assessmentId: 'a1', questionId: 'q1', sortOrder: 1 },
          { assessmentId: 'a1', questionId: 'q2', sortOrder: 2 },
        ],
      });
    });
  });
});
