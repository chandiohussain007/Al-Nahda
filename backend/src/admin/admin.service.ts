import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CourseStatus,
  EnrollmentStatus,
  FeeStatus,
  Prisma,
  TeacherStatus,
  UserRole,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Pagination } from '../common/pagination.dto.js';
import { CreateCourseDto, ResolveFeeDto, UpdateCourseDto } from './admin.dto.js';

const USER_SUMMARY_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  isActive: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listCourses() {
    return this.prisma.courseItem.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createCourse(dto: CreateCourseDto) {
    try {
      return await this.prisma.courseItem.create({
        data: {
          ...dto,
          description: dto.description ?? null,
          standardFee: dto.standardFee ?? null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A course with this slug already exists');
      }
      throw error;
    }
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.courseItem.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    try {
      return await this.prisma.courseItem.update({
        where: { id: courseId },
        data: dto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A course with this slug already exists');
      }
      throw error;
    }
  }

  async archiveCourse(courseId: string) {
    const course = await this.prisma.courseItem.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.courseItem.update({
      where: { id: courseId },
      data: { status: CourseStatus.ARCHIVED },
    });
  }

  async setUserActive(userId: string, isActive: boolean, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.id === actorId) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Administrator accounts cannot be deactivated here');
    }
    if (user.isActive === isActive) {
      return this.prisma.user.findUnique({
        where: { id: userId },
        select: USER_SUMMARY_SELECT,
      });
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: USER_SUMMARY_SELECT,
    });
  }

  listTeachers(status?: TeacherStatus, pagination?: Pagination) {
    return this.prisma.teacherProfile.findMany({
      where: status ? { teacherStatus: status } : {},
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
      ...pagination,
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

  listStudents(pagination?: Pagination) {
    return this.prisma.studentProfile.findMany({
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
      ...pagination,
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

  listEnrollments(status?: EnrollmentStatus, pagination?: Pagination) {
    return this.prisma.enrollment.findMany({
      where: status ? { status } : {},
      include: {
        student: { select: { id: true, fullName: true, userId: true } },
        teacher: { select: { id: true, fullName: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...pagination,
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

  /** Admin: agree the fee on an original (teacher) enrollment. */
  async resolveEnrollmentFee(enrollmentId: string, dto: ResolveFeeDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { select: { userId: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.feeStatus !== FeeStatus.PROPOSED) {
      throw new ConflictException(
        `Fee decision already made (status: ${enrollment.feeStatus})`,
      );
    }

    const agreedFee = dto.agreedFee ?? enrollment.proposedFee;
    if (agreedFee === null || agreedFee === undefined) {
      throw new BadRequestException('No proposed fee to agree on');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { agreedFee, feeStatus: FeeStatus.AGREED },
    });

    await this.notificationsService.create({
      recipientId: enrollment.student.userId,
      message: `Your fee of ${agreedFee} for ${enrollment.courseName} was approved.`,
    });

    return updated;
  }

  /** Admin: decline the student's proposed fee. */
  async rejectEnrollmentFee(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { select: { userId: true } } },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.feeStatus !== FeeStatus.PROPOSED) {
      throw new ConflictException(
        `Fee decision already made (status: ${enrollment.feeStatus})`,
      );
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { agreedFee: null, feeStatus: FeeStatus.REJECTED },
    });

    await this.notificationsService.create({
      recipientId: enrollment.student.userId,
      message: `Your proposed fee for ${enrollment.courseName} was declined.`,
    });

    return updated;
  }

  /** Admin: overwrite anyone's profile picture via a direct web link. */
  async setProfilePicture(userId: string, profilePictureUrl: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (student) {
      return this.prisma.studentProfile.update({
        where: { id: student.id },
        data: { profilePictureUrl },
      });
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (teacher) {
      return this.prisma.teacherProfile.update({
        where: { id: teacher.id },
        data: { profilePictureUrl },
      });
    }

    throw new NotFoundException('No profile found for this user');
  }

  /** Admin: clear anyone's profile picture. */
  async clearProfilePicture(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (student) {
      return this.prisma.studentProfile.update({
        where: { id: student.id },
        data: { profilePictureUrl: null },
      });
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (teacher) {
      return this.prisma.teacherProfile.update({
        where: { id: teacher.id },
        data: { profilePictureUrl: null },
      });
    }

    throw new NotFoundException('No profile found for this user');
  }

  /** Admin: set a teacher's CV link. */
  async setCv(userId: string, cvUrl: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found for this user');
    return this.prisma.teacherProfile.update({ where: { id: teacher.id }, data: { cvUrl } });
  }

  /** Admin: clear a teacher's CV link. */
  async clearCv(userId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found for this user');
    return this.prisma.teacherProfile.update({ where: { id: teacher.id }, data: { cvUrl: null } });
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
