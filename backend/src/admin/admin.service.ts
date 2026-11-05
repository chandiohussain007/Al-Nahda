import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Course,
  CourseStatus,
  EnrollmentStatus,
  FeeStatus,
  Level,
  Prisma,
  TeacherStatus,
  UserRole,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { findUsersByIdsOrNumbers, getUserIdNumber } from '../common/user-id.util.js';
import { SendAdminNotificationDto } from './admin.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Pagination } from '../common/pagination.dto.js';
import { CreateCourseDto, CreateTeacherDto, AssignTeacherToStudentDto, ResolveFeeDto, UpdateCourseDto } from './admin.dto.js';
import bcrypt from 'bcrypt';

const USER_SUMMARY_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  isActive: true,
} as const;

export async function attachUserIdNumbers<T extends { user?: { id: string } | null; userId?: string }>(
  prisma: any,
  items: T[],
): Promise<(T & { userIdNumber?: string })[]> {
  return Promise.all(
    items.map(async (item) => {
      const uId = item.user?.id || item.userId;
      const num = uId ? await getUserIdNumber(prisma, uId) : undefined;
      return {
        ...item,
        userIdNumber: num,
        user: item.user ? { ...item.user, userIdNumber: num } : item.user,
      };
    }),
  );
}

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

  async createTeacher(dto: CreateTeacherDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.TEACHER,
        teacherProfile: {
          create: {
            fullName: dto.fullName.trim(),
            experienceYears: 1,
            phoneNumber: dto.phoneNumber?.trim() || null,
            subjectsTaught: dto.subject?.trim() ? [dto.subject.trim()] : [],
            bio: dto.bio?.trim() || (dto.subject ? 'Subject: ' + dto.subject : null),
            teacherStatus: TeacherStatus.APPROVED,
          },
        },
      },
      select: USER_SUMMARY_SELECT,
    });
  }

  async listTeachers(status?: TeacherStatus, pagination?: Pagination) {
    const teachers = await this.prisma.teacherProfile.findMany({
      where: status ? { teacherStatus: status } : {},
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
      ...pagination,
    });
    return attachUserIdNumbers(this.prisma, teachers);
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

  async listStudents(pagination?: Pagination) {
    const students = await this.prisma.studentProfile.findMany({
      include: { user: { select: USER_SUMMARY_SELECT } },
      orderBy: { fullName: 'asc' },
      ...pagination,
    });
    return attachUserIdNumbers(this.prisma, students);
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

  async assignTeacherToStudent(
    studentId: string,
    dto: AssignTeacherToStudentDto,
    actorId: string,
  ) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: { select: { id: true, isActive: true } } },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    if (!student.user?.isActive) throw new ForbiddenException('Student account is not active');

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: dto.teacherId },
      include: { user: { select: { id: true, isActive: true } } },
    });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    if (teacher.teacherStatus !== 'APPROVED') {
      throw new ForbiddenException('Teacher is not approved');
    }
    if (!teacher.user?.isActive) throw new ForbiddenException('Teacher account is not active');

    // Prevent duplicate active enrollment for same student+teacher
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        teacherId: teacher.id,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    });
    if (existing) {
      throw new ConflictException(
        'An active or pending enrollment already exists between this student and teacher',
      );
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        courseName: dto.courseName as Course,
        confirmedLevel: dto.confirmedLevel as Level,
        preferredTimeSlot: dto.preferredTimeSlot,
        status: EnrollmentStatus.ACTIVE,
        proposedFee: null,
        feeStatus: 'NONE',
      },
      include: { student: true, teacher: true },
    });

    await this.notificationsService.create({
      recipientId: student.userId,
      senderId: actorId,
      message: `You have been assigned to ${teacher.fullName} for ${dto.courseName} (${dto.confirmedLevel}). Classes at ${dto.preferredTimeSlot}.`,
    });

    await this.notificationsService.create({
      recipientId: teacher.userId,
      senderId: actorId,
      message: `You have been assigned a new student: ${student.fullName} for ${dto.courseName} (${dto.confirmedLevel}). Classes at ${dto.preferredTimeSlot}.`,
    });

    return enrollment;
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
  async sendNotification(senderId: string, dto: SendAdminNotificationDto) {
    const targetTokens = dto.recipientId
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (targetTokens.length === 0) {
      throw new NotFoundException('Please specify at least one recipient User ID');
    }

    const matchedUsers = await findUsersByIdsOrNumbers(this.prisma, targetTokens);
    if (matchedUsers.length === 0) {
      throw new NotFoundException('No user found matching the provided User ID(s)');
    }

    const created = await Promise.all(
      matchedUsers.map((recipient) =>
        this.notificationsService.create({
          recipientId: recipient.id,
          senderId,
          message: dto.message,
        }),
      ),
    );

    return { sentCount: created.length, recipients: matchedUsers.map((u) => u.userIdNumber) };
  }
}
