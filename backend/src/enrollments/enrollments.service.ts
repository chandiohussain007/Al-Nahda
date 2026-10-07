import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, FeeStatus, Level, UserRole } from '@prisma/client';
import { stripTeacherPrivacy } from '../common/privacy.js';
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

    const hasProposal = typeof dto.proposedFee === 'number';

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        courseName: dto.courseName,
        confirmedLevel,
        preferredTimeSlot: dto.preferredTimeSlot,
        proposedFee: hasProposal ? dto.proposedFee : null,
        feeStatus: hasProposal ? FeeStatus.PROPOSED : FeeStatus.NONE,
      },
      include: { student: true, teacher: true },
    });

    await this.notificationsService.create({
      recipientId: teacher.userId,
      senderId: student.userId,
      message: `New enrollment request from ${student.fullName} for ${dto.courseName} (${dto.preferredTimeSlot}).`,
    });

    // Students never see the teacher's phone number.
    return {
      ...enrollment,
      teacher: stripTeacherPrivacy(enrollment.teacher, {
        sub: userId,
        role: UserRole.STUDENT,
      }),
    };
  }

  /**
   * Teacher-side resolution of their own enrollment request. Only the owning
   * teacher may act, and only while the request is still PENDING — the admin
   * endpoints stay available for any later status change.
   */
  async teacherResolve(userId: string, enrollmentId: string, accept: boolean) {
    const teacher = await this.teachersService.getProfile(userId);

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { select: { userId: true, fullName: true } } },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.teacherId !== teacher.id) {
      throw new ForbiddenException('You can only manage your own enrollments');
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(`Enrollment is already ${enrollment.status}`);
    }

    const status = accept ? EnrollmentStatus.ACTIVE : EnrollmentStatus.CANCELLED;

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: { student: true, teacher: true },
    });

    await this.notificationsService.create({
      recipientId: enrollment.student.userId,
      senderId: teacher.userId,
      message: accept
        ? `Your enrollment for ${enrollment.courseName} was accepted. Classes are at ${enrollment.preferredTimeSlot}.`
        : `Your enrollment request for ${enrollment.courseName} was declined.`,
    });

    return updated;
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

    // phoneNumber is only exposed to the profile owner and to admins.
    return {
      ...enrollment,
      teacher: stripTeacherPrivacy(enrollment.teacher, { sub: userId, role }),
    };
  }
}
