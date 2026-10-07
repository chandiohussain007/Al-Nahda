import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Course, Difficulty, Level, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuestionDto, UpdateQuestionDto } from './questions.dto.js';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, userId: string) {
    const options = this.parseOptions(dto.options);
    this.validateOptionId(options, dto.correctOptionId);

    return this.prisma.question.create({
      data: {
        text: dto.text,
        type: dto.type,
        difficulty: dto.difficulty ?? Difficulty.MEDIUM,
        course: dto.course,
        level: dto.level,
        options,
        correctOptionId: dto.correctOptionId,
        points: dto.points ?? 1,
        explanation: dto.explanation,
        createdBy: userId,
      },
    });
  }

  async findAll(filters?: { course?: Course; level?: Level; difficulty?: Difficulty }) {
    return this.prisma.question.findMany({
      where: {
        ...(filters?.course ? { course: filters.course } : {}),
        ...(filters?.level ? { level: filters.level } : {}),
        ...(filters?.difficulty ? { difficulty: filters.difficulty } : {}),
      },
      orderBy: [{ course: 'asc' }, { level: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException(`Question ${id} not found`);
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto, userId: string, userRole: UserRole) {
    const question = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && question.createdBy !== userId) {
      throw new ForbiddenException('You can only edit your own questions');
    }

    const updates: Record<string, unknown> = { ...dto };

    if (dto.options) {
      const options = this.parseOptions(dto.options);
      const correctId = dto.correctOptionId ?? (question.correctOptionId as string);
      this.validateOptionId(options, correctId);
      updates['options'] = options;
    }

    return this.prisma.question.update({ where: { id }, data: updates });
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const question = await this.findOne(id);

    if (userRole !== UserRole.ADMIN && question.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    await this.prisma.question.delete({ where: { id } });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private parseOptions(raw: string): { id: string; text: string }[] {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) throw new Error('options must be an array');
      return parsed as { id: string; text: string }[];
    } catch {
      throw new BadRequestException('options must be a valid JSON array of { id, text } objects');
    }
  }

  private validateOptionId(options: { id: string }[], correctOptionId: string) {
    const ids = options.map((o) => o.id);
    if (!ids.includes(correctOptionId)) {
      throw new BadRequestException(
        `correctOptionId "${correctOptionId}" is not among the provided option ids`,
      );
    }
  }
}
