import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Course, Level, TestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentsService } from '../students/students.service.js';
import { EvaluationsService } from './evaluations.service.js';

const prismaMock = {
  evaluationQuestion: { findMany: vi.fn() },
  evaluationTest: { create: vi.fn(), findUnique: vi.fn() },
};

const studentsServiceMock = { getProfile: vi.fn() };

describe('EvaluationsService', () => {
  let service: EvaluationsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: StudentsService, useValue: studentsServiceMock },
      ],
    }).compile();

    service = moduleRef.get(EvaluationsService);
  });

  it('keeps the claimed level when the score meets the pass threshold', async () => {
    studentsServiceMock.getProfile.mockResolvedValue({ id: 'student-1' });
    prismaMock.evaluationQuestion.findMany.mockResolvedValue([
      { id: 'q1', correctAnswer: 'A' },
      { id: 'q2', correctAnswer: 'B' },
    ]);
    prismaMock.evaluationTest.create.mockImplementation(({ data }: { data: unknown }) => data);

    const result = await service.submit('user-1', {
      course: Course.LEARN_QURAN,
      claimedLevel: Level.INTERMEDIATE,
      answers: [
        { questionId: 'q1', answer: 'a' },
        { questionId: 'q2', answer: 'B' },
      ],
    });

    expect(prismaMock.evaluationTest.create).toHaveBeenCalledTimes(1);
    const createArgs = prismaMock.evaluationTest.create.mock.calls[0][0];
    expect(createArgs.data.score).toBe(100);
    expect(createArgs.data.assignedLevel).toBe(Level.INTERMEDIATE);
    expect(createArgs.data.status).toBe(TestStatus.PASSED);
    expect(result).toMatchObject({ assignedLevel: Level.INTERMEDIATE });
  });

  it('recommends demotion by one level for a mid-range score', () => {
    expect(service.resolveLevel(Level.INTERMEDIATE, 60)).toEqual({
      assignedLevel: Level.BEGINNER,
      status: TestStatus.DEMOTED_RECOMMENDED,
    });
  });

  it('never demotes below the beginner level', () => {
    expect(service.resolveLevel(Level.BEGINNER, 10)).toEqual({
      assignedLevel: Level.BEGINNER,
      status: TestStatus.DEMOTED_RECOMMENDED,
    });
  });

  it('rejects answers that reference unknown questions', async () => {
    studentsServiceMock.getProfile.mockResolvedValue({ id: 'student-1' });
    prismaMock.evaluationQuestion.findMany.mockResolvedValue([]);

    await expect(
      service.submit('user-1', {
        course: Course.LEARN_ARABIC,
        claimedLevel: Level.BEGINNER,
        answers: [
          { questionId: '00000000-0000-0000-0000-000000000000', answer: 'A' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.evaluationTest.create).not.toHaveBeenCalled();
  });
});
