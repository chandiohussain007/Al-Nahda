import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttemptStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { GradingService } from './grading.service.js';

export interface StartAttemptInput {
  assessmentId: string;
  enrollmentId?: string;
}

export interface SubmitAnswerInput {
  questionId: string;
  selectedOptionId: string | null;
}

@Injectable()
export class AttemptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly grading: GradingService,
  ) {}

  /** Start a new attempt for a student. Enforces attempt limits. */
  async start(userId: string, input: StartAttemptInput) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: input.assessmentId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${input.assessmentId} not found`);
    }

    if (assessment.status !== 'PUBLISHED') {
      throw new BadRequestException('Assessment is not published yet');
    }

    // Check existing attempt count
    const existingCount = await this.prisma.attempt.count({
      where: {
        studentId: userId,
        assessmentId: input.assessmentId,
        status: { not: AttemptStatus.CANCELLED },
      },
    });

    if (existingCount >= assessment.attemptsAllowed) {
      throw new BadRequestException(
        `You have used all ${assessment.attemptsAllowed} allowed attempt(s) for this assessment`,
      );
    }

    // Pick questions (shuffle if configured)
    let questionPool = assessment.questions;
    if (assessment.shuffleQuestions) {
      questionPool = [...questionPool].sort(() => Math.random() - 0.5);
    }
    const selected = questionPool.slice(0, assessment.questionsPerAttempt);

    // Create attempt + snapshot of questions served
    const attempt = await this.prisma.attempt.create({
      data: {
        studentId: userId,
        assessmentId: input.assessmentId,
        enrollmentId: input.enrollmentId,
        questions: {
          create: selected.map((aq, idx) => ({
            questionId: aq.questionId,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        questions: {
          include: {
            question: {
              // Never expose correctOptionId to the student during an attempt
              select: {
                id: true,
                text: true,
                type: true,
                options: true,
                points: true,
                difficulty: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return {
      attemptId: attempt.id,
      durationMinutes: assessment.durationMinutes,
      questions: attempt.questions.map((aq) => aq.question),
    };
  }

  /** Save or update the student's answer for one question. */
  async saveAnswer(userId: string, attemptId: string, input: SubmitAnswerInput) {
    const attempt = await this.requireInProgressAttempt(userId, attemptId);

    // Verify question belongs to this attempt
    const attemptQuestion = await this.prisma.attemptQuestion.findFirst({
      where: { attemptId, questionId: input.questionId },
    });

    if (!attemptQuestion) {
      throw new BadRequestException(
        `Question ${input.questionId} is not part of attempt ${attemptId}`,
      );
    }

    await this.prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId: input.questionId } },
      create: {
        attemptId,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId,
      },
      update: { selectedOptionId: input.selectedOptionId },
    });

    return { saved: true, attemptId, questionId: input.questionId };
  }

  /** Submit the attempt, grade it, and return the result. */
  async submit(userId: string, attemptId: string) {
    const attempt = await this.requireInProgressAttempt(userId, attemptId);

    const assessment = await this.prisma.assessment.findUniqueOrThrow({
      where: { id: attempt.assessmentId },
    });

    // Load all questions served in this attempt with their correct answers
    const attemptQuestions = await this.prisma.attemptQuestion.findMany({
      where: { attemptId },
      include: { question: { select: { id: true, correctOptionId: true, points: true } } },
    });

    // Load student's answers
    const answers = await this.prisma.attemptAnswer.findMany({ where: { attemptId } });
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

    // Grade
    const gradeInputs = attemptQuestions.map((aq) => ({
      questionId: aq.questionId,
      selectedOptionId: answerMap.get(aq.questionId) ?? null,
      correctOptionId: aq.question.correctOptionId,
      points: aq.question.points,
    }));

    const result = this.grading.grade(gradeInputs, assessment.passPercentage);

    // Persist correctness on each answer
    await Promise.all(
      gradeInputs.map((g) =>
        this.prisma.attemptAnswer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: g.questionId } },
          create: {
            attemptId,
            questionId: g.questionId,
            selectedOptionId: g.selectedOptionId,
            isCorrect: this.grading.isCorrect(g.selectedOptionId, g.correctOptionId),
            pointsEarned: this.grading.isCorrect(g.selectedOptionId, g.correctOptionId)
              ? g.points
              : 0,
          },
          update: {
            isCorrect: this.grading.isCorrect(g.selectedOptionId, g.correctOptionId),
            pointsEarned: this.grading.isCorrect(g.selectedOptionId, g.correctOptionId)
              ? g.points
              : 0,
          },
        }),
      ),
    );

    // Update attempt record
    const updated = await this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        score: result.score,
        percentage: result.percentage,
        passed: result.passed,
        submittedAt: new Date(),
        timeSpentSeconds: Math.round(
          (Date.now() - new Date(attempt.startedAt).getTime()) / 1000,
        ),
      },
      include: { assessment: { select: { showResultAfterSubmit: true, passPercentage: true } } },
    });

    if (!updated.assessment.showResultAfterSubmit) {
      return { message: 'Attempt submitted. Results will be released later.' };
    }

    return {
      attemptId,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
      passPercentage: assessment.passPercentage,
    };
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { select: { title: true, passPercentage: true, showResultAfterSubmit: true } },
        answers: true,
      },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.studentId !== userId)
      throw new ForbiddenException('You can only view your own attempts');

    return attempt;
  }

  async listMyAttempts(userId: string) {
    return this.prisma.attempt.findMany({
      where: { studentId: userId },
      include: {
        assessment: { select: { id: true, title: true, passPercentage: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private async requireInProgressAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.studentId !== userId)
      throw new ForbiddenException('You can only access your own attempts');
    if (attempt.status !== AttemptStatus.IN_PROGRESS)
      throw new BadRequestException(`Attempt is already ${attempt.status}`);
    return attempt;
  }
}
