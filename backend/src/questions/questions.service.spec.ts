import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Course, Difficulty, Level, QuestionType, UserRole } from '@prisma/client';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      question: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  describe('create', () => {
    it('throws BadRequestException if options is invalid JSON', async () => {
      await expect(
        service.create(
          {
            text: 'Q1',
            type: QuestionType.MULTIPLE_CHOICE,
            course: Course.LEARN_QURAN,
            level: Level.BEGINNER,
            options: 'invalid json',
            correctOptionId: 'a',
          },
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if correctOptionId is not in options', async () => {
      const options = JSON.stringify([{ id: 'b', text: 'Option B' }]);
      await expect(
        service.create(
          {
            text: 'Q1',
            type: QuestionType.MULTIPLE_CHOICE,
            course: Course.LEARN_QURAN,
            level: Level.BEGINNER,
            options,
            correctOptionId: 'a',
          },
          'user1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a question successfully', async () => {
      const options = JSON.stringify([{ id: 'a', text: 'Option A' }]);
      prisma.question.create.mockResolvedValue({ id: 'q1' });
      const res = await service.create(
        {
          text: 'Q1',
          type: QuestionType.MULTIPLE_CHOICE,
          course: Course.LEARN_QURAN,
          level: Level.BEGINNER,
          options,
          correctOptionId: 'a',
          points: 5,
        },
        'user1',
      );
      expect(prisma.question.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          text: 'Q1',
          correctOptionId: 'a',
          points: 5,
          createdBy: 'user1',
        }),
      });
      expect(res).toEqual({ id: 'q1' });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if question does not exist', async () => {
      prisma.question.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });

    it('returns the question', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1' });
      const res = await service.findOne('q1');
      expect(res).toEqual({ id: 'q1' });
    });
  });

  describe('update', () => {
    it('throws ForbiddenException if user is not admin and did not create it', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', createdBy: 'other' });
      await expect(service.update('q1', {}, 'user1', UserRole.TEACHER)).rejects.toThrow(ForbiddenException);
    });

    it('rejects malformed option payloads when updating options', async () => {
      prisma.question.findUnique.mockResolvedValue({
        id: 'q1',
        createdBy: 'user1',
        correctOptionId: 'a',
      });

      await expect(
        service.update('q1', { options: '{bad json}', correctOptionId: 'a' }, 'user1', UserRole.TEACHER),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows admin to update any question', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', createdBy: 'other' });
      prisma.question.update.mockResolvedValue({ id: 'q1', text: 'Updated' });
      const res = await service.update('q1', { text: 'Updated' }, 'admin1', UserRole.ADMIN);
      expect(res).toEqual({ id: 'q1', text: 'Updated' });
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException if user is not admin and did not create it', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', createdBy: 'other' });
      await expect(service.remove('q1', 'user1', UserRole.TEACHER)).rejects.toThrow(ForbiddenException);
    });

    it('allows creator to remove question', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', createdBy: 'user1' });
      await service.remove('q1', 'user1', UserRole.TEACHER);
      expect(prisma.question.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
    });

    it('allows admin to remove another teacher\'s question', async () => {
      prisma.question.findUnique.mockResolvedValue({ id: 'q1', createdBy: 'teacher-1' });
      await service.remove('q1', 'admin-1', UserRole.ADMIN);
      expect(prisma.question.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
    });
  });
});
