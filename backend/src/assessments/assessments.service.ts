import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AddQuestionsDto,
  CreateAssessmentDto,
  UpdateAssessmentDto,
} from './assessments.dto.js';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssessmentDto, userId: string) {
    // Verify course exists
    const course = await this.prisma.courseItem.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException(`CourseItem ${dto.courseId} not found`);

    if (dto.levelId) {
      const level = await this.prisma.levelContent.findUnique({ where: { id: dto.levelId } });
      if (!level) throw new NotFoundException(`LevelContent ${dto.levelId} not found`);
    }

    return this.prisma.assessment.create({
      data: {
        courseId: dto.courseId,
        levelId: dto.levelId,
        title: dto.title,
        description: dto.description,
        durationMinutes: dto.durationMinutes,
        passPercentage: dto.passPercentage ?? 60,
        attemptsAllowed: dto.attemptsAllowed ?? 1,
        questionsPerAttempt: dto.questionsPerAttempt ?? 10,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleOptions: dto.shuffleOptions ?? false,
        showResultAfterSubmit: dto.showResultAfterSubmit ?? true,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        course: { select: { id: true, name: true, slug: true } },
        level: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        course: true,
        level: true,
        questions: {
          include: { question: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!assessment) throw new NotFoundException(`Assessment ${id} not found`);
    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    await this.findOne(id);
    return this.prisma.assessment.update({ where: { id }, data: dto });
  }

  async publish(id: string) {
    const assessment = await this.findOne(id);

    if (assessment.questions.length === 0) {
      throw new BadRequestException('Cannot publish an assessment with no questions');
    }

    return this.prisma.assessment.update({
      where: { id },
      data: { status: AssessmentStatus.PUBLISHED },
    });
  }

  async addQuestions(id: string, dto: AddQuestionsDto) {
    await this.findOne(id);

    // Verify all question IDs exist
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
      select: { id: true },
    });

    if (questions.length !== dto.questionIds.length) {
      const foundIds = new Set(questions.map((q) => q.id));
      const missing = dto.questionIds.filter((qid) => !foundIds.has(qid));
      throw new NotFoundException(`Question(s) not found: ${missing.join(', ')}`);
    }

    // Remove existing questions and re-insert in the specified order
    await this.prisma.assessmentQuestion.deleteMany({ where: { assessmentId: id } });

    const data = dto.questionIds.map((questionId, index) => ({
      assessmentId: id,
      questionId,
      sortOrder: index + 1,
    }));

    await this.prisma.assessmentQuestion.createMany({ data });

    return this.findOne(id);
  }
}
