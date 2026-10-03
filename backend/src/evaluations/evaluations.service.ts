import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, Level, TestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentsService } from '../students/students.service.js';
import { SubmitEvaluationDto } from './evaluations.dto.js';

const LEVEL_ORDER: Level[] = [Level.BEGINNER, Level.INTERMEDIATE, Level.ADVANCED];
const PASS_THRESHOLD = 80;

export interface LevelResolution {
  assignedLevel: Level;
  status: TestStatus;
}

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentsService: StudentsService,
  ) {}

  /** Questions for a course/level, without leaking the correct answers. */
  async listQuestions(course: Course, level: Level) {
    const questions = await this.prisma.evaluationQuestion.findMany({
      where: { course, level },
      orderBy: { question: 'asc' },
    });

    return questions.map((question) => ({
      id: question.id,
      course: question.course,
      level: question.level,
      question: question.question,
      options: question.options,
    }));
  }

  /**
   * Scores a submitted test, persists the result and returns the awarded
   * level. A score at or above {@link PASS_THRESHOLD} keeps the claimed level;
   * lower scores recommend demotion by one or two levels.
   */
  async submit(userId: string, dto: SubmitEvaluationDto) {
    const student = await this.studentsService.getProfile(userId);

    const questionIds = dto.answers.map((answer) => answer.questionId);
    const questions = await this.prisma.evaluationQuestion.findMany({
      where: { id: { in: questionIds } },
    });
    const questionMap = new Map(questions.map((question) => [question.id, question]));

    let correctCount = 0;
    const answerRecords = dto.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        throw new BadRequestException(`Unknown evaluation question: ${answer.questionId}`);
      }

      const isCorrect =
        question.correctAnswer.trim().toLowerCase() === answer.answer.trim().toLowerCase();
      if (isCorrect) {
        correctCount += 1;
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        points: isCorrect ? 1 : 0,
      };
    });

    const totalQuestions = dto.answers.length;
    const score =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 10000) / 100;
    const { assignedLevel, status } = this.resolveLevel(dto.claimedLevel, score);

    return this.prisma.evaluationTest.create({
      data: {
        studentId: student.id,
        claimedLevel: dto.claimedLevel,
        assignedLevel,
        score,
        status,
        completedAt: new Date(),
        answers: { create: answerRecords },
      },
      include: { answers: true },
    });
  }

  resolveLevel(claimedLevel: Level, score: number): LevelResolution {
    const claimedIndex = LEVEL_ORDER.indexOf(claimedLevel);

    if (score >= PASS_THRESHOLD) {
      return { assignedLevel: claimedLevel, status: TestStatus.PASSED };
    }

    const demoteBy = score >= 50 ? 1 : 2;
    const assignedIndex = Math.max(0, claimedIndex - demoteBy);

    return {
      assignedLevel: LEVEL_ORDER[assignedIndex],
      status: TestStatus.DEMOTED_RECOMMENDED,
    };
  }

  async getTest(userId: string, testId: string) {
    const student = await this.studentsService.getProfile(userId);

    const test = await this.prisma.evaluationTest.findUnique({
      where: { id: testId },
      include: { answers: true },
    });

    if (!test) {
      throw new NotFoundException('Evaluation test not found');
    }

    if (test.studentId !== student.id) {
      throw new ForbiddenException('You can only view your own evaluation');
    }

    return test;
  }
}
