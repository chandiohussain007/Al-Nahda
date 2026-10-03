import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Level, UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentsService } from '../students/students.service.js';
import { TeachersService } from '../teachers/teachers.service.js';
import { CreateEnrollmentDto } from './enrollments.dto.js';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentsService: StudentsService,
    private readonly teachersService: TeachersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateEnrollmentDto) {
    const student = await this.studentsService.getProfile(userId);

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    let confirmedLevel: Level | null = dto.confirmedLevel ?? null;

    if (dto.evaluationTestId) {
      const test = await this.prisma.evaluationTest.findUnique({
        where: { id: dto.evaluationTestId },
      });

      if (!test) {
        throw new NotFoundException('Evaluation test not found');
      }

      if (test.studentId !== student.id) {
        throw new ForbiddenException('The evaluation test does not belong to this student');
      }

      confirmedLevel = test.assignedLevel;
    }

    if (!confirmedLevel) {
      throw new BadRequestException('Provide confirmedLevel or evaluationTestId');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        courseName: dto.courseName,
        confirmedLevel,
        preferredTimeSlot: dto.preferredTimeSlot,
      },
      include: { student: true, teacher: true },
    });

    await this.notificationsService.create({
      recipientId: teacher.userId,
      senderId: student.userId,
      message: `New enrollment request from ${student.fullName} for ${dto.courseName} (${dto.preferredTimeSlot}).`,
    });

    return enrollment;
  }

  async list(userId: string, role: UserRole) {
    if (role === UserRole.STUDENT) {
      const student = await this.studentsService.getProfile(userId);

      return this.prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: { teacher: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    const teacher = await this.teachersService.getProfile(userId);

    return this.prisma.enrollment.findMany({
      where: { teacherId: teacher.id },
      include: { student: { select: { id: true, fullName: true, whatsappNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(userId: string, role: UserRole, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        teacher: true,
        attendance: { orderBy: { date: 'asc' } },
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

    return enrollment;
  }
}
