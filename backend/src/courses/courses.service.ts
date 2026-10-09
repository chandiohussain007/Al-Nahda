import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public catalog: published courses only, ordered for stable display. */
  findAll() {
    return this.prisma.courseItem.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findLevels(courseId: string) {
    const course = await this.prisma.courseItem.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    return this.prisma.levelContent.findMany({
      where: { courseId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
