import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, TeacherStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const USER_SUMMARY_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listTeachers(status?: TeacherStatus) {
    return this.prisma.teacherProfile.findMany({
      where: status ? { teacherStatus: status } : {},
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
    });
  }

  async setTeacherStatus(teacherId: string, teacherStatus: TeacherStatus) {
    const teacher = await this.getTeacherOrThrow(teacherId);

    const updated = await this.prisma.teacherProfile.update({
      where: { id: teacher.id },
      data: { teacherStatus },
    });

    await this.notificationsService.create({
      recipientId: teacher.userId,
      message:
        teacherStatus === TeacherStatus.APPROVED
          ? 'Your teacher account has been approved. You now have full access.'
          : 'Your teacher application was reviewed and was not approved.',
    });

    return updated;
  }

  listStudents() {
    return this.prisma.studentProfile.findMany({
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
    });
  }

  async getStudent(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: USER_SUMMARY_SELECT },
        enrollments: {
          include: { teacher: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        evaluationTests: { orderBy: { startedAt: 'desc' } },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  listEnrollments(status?: EnrollmentStatus) {
    return this.prisma.enrollment.findMany({
      where: status ? { status } : {},
      include: {
        student: { select: { id: true, fullName: true, userId: true } },
        teacher: { select: { id: true, fullName: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setEnrollmentStatus(enrollmentId: string, status: EnrollmentStatus) {
    const enrollment = await this.getEnrollmentOrThrow(enrollmentId);

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status },
    });

    const message =
      status === EnrollmentStatus.ACTIVE
        ? `Your enrollment for ${enrollment.courseName} has been activated.`
        : `Your enrollment for ${enrollment.courseName} was rejected.`;

    await this.notificationsService.create({
      recipientId: enrollment.student.userId,
      message,
    });
    await this.notificationsService.create({
      recipientId: enrollment.teacher.userId,
      message,
    });

    return updated;
  }

  private async getTeacherOrThrow(teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    return teacher;
  }

  private async getEnrollmentOrThrow(enrollmentId: string) {
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

    return enrollment;
  }
}
