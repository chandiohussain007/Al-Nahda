import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RecordHifzProgressDto } from './hifz.dto.js';

@Injectable()
export class HifzService {
  constructor(private readonly prisma: PrismaService) {}

  async recordProgress(teacherUserId: string, dto: RecordHifzProgressDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { teacher: true, student: true },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (enrollment.teacher.userId !== teacherUserId) {
      throw new ForbiddenException('Only the assigned teacher can log Hifz progress');
    }

    return this.prisma.hifzProgress.create({
      data: {
        enrollmentId: dto.enrollmentId,
        studentId: enrollment.student.id,
        sabaqSurah: dto.sabaqSurah,
        sabaqFrom: dto.sabaqFrom,
        sabaqTo: dto.sabaqTo,
        sabqiSurah: dto.sabqiSurah,
        sabqiFrom: dto.sabqiFrom,
        sabqiTo: dto.sabqiTo,
        manzilSurah: dto.manzilSurah,
        manzilFrom: dto.manzilFrom,
        manzilTo: dto.manzilTo,
        teacherNotes: dto.teacherNotes,
      },
    });
  }

  async getProgressForEnrollment(enrollmentId: string, userId: string, role: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, teacher: true },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (role === 'STUDENT' && enrollment.student.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'TEACHER' && enrollment.teacher.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.hifzProgress.findMany({
      where: { enrollmentId },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }
}
