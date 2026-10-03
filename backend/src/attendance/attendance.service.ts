import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { TeachersService } from '../teachers/teachers.service.js';
import { RecordAttendanceDto } from './attendance.dto.js';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teachersService: TeachersService,
  ) {}

  async record(userId: string, dto: RecordAttendanceDto) {
    const teacher = await this.teachersService.getProfile(userId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only record attendance for your own classes');
    }

    const date = new Date(dto.date);

    return this.prisma.attendance.upsert({
      where: { enrollmentId_date: { enrollmentId: dto.enrollmentId, date } },
      create: { enrollmentId: dto.enrollmentId, date, status: dto.status },
      update: { status: dto.status },
    });
  }

  async list(userId: string, role: UserRole, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: { select: { userId: true } },
        teacher: { select: { userId: true } },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const ownerUserId =
      role === UserRole.STUDENT ? enrollment.student.userId : enrollment.teacher.userId;

    if (ownerUserId !== userId) {
      throw new ForbiddenException('You do not have access to this enrollment');
    }

    return this.prisma.attendance.findMany({
      where: { enrollmentId },
      orderBy: { date: 'asc' },
    });
  }
}
