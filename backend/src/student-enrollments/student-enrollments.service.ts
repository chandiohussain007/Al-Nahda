import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeeStatus, StudentEnrollmentStatus } from '@prisma/client';
import { ResolveFeeDto } from '../admin/admin.dto.js';
import type { Pagination } from '../common/pagination.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateStudentEnrollmentDto,
  UpdateEnrollmentStatusDto,
} from './student-enrollments.dto.js';

@Injectable()
export class StudentEnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Student applies to enroll in a course. */
  async apply(userId: string, dto: CreateStudentEnrollmentDto) {
    // Verify course
    const course = await this.prisma.courseItem.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException(`Course ${dto.courseId} not found`);

    if (course.status !== 'PUBLISHED') {
      throw new BadRequestException('This course is not open for enrollment');
    }

    // Prevent duplicate pending/active enrollments
    const existing = await this.prisma.studentEnrollment.findFirst({
      where: {
        studentId: userId,
        courseId: dto.courseId,
        status: {
          in: [
            StudentEnrollmentStatus.PENDING,
            StudentEnrollmentStatus.IN_PROGRESS,
            StudentEnrollmentStatus.ACTIVE,
            StudentEnrollmentStatus.ASSESSMENT_REQUIRED,
            StudentEnrollmentStatus.ASSESSMENT_COMPLETED,
          ],
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `You already have an active enrollment for this course (status: ${existing.status})`,
      );
    }

    const hasProposal = typeof dto.proposedFee === 'number';

    return this.prisma.studentEnrollment.create({
      data: {
        studentId: userId,
        courseId: dto.courseId,
        selectedLevelId: dto.selectedLevelId,
        applicationData: dto.applicationData,
        proposedFee: hasProposal ? dto.proposedFee : null,
        feeStatus: hasProposal ? FeeStatus.PROPOSED : FeeStatus.NONE,
      },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        selectedLevel: { select: { id: true, name: true } },
      },
    });
  }

  /** Student: list own enrollments. */
  async listMine(userId: string, pagination?: Pagination) {
    return this.prisma.studentEnrollment.findMany({
      where: { studentId: userId },
      include: {
        course: { select: { id: true, name: true, slug: true } },
        selectedLevel: { select: { id: true, name: true } },
        assignedAssessment: { select: { id: true, title: true, durationMinutes: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...pagination,
    });
  }

  /** Admin: list all enrollments (with optional status filter). */
  async listAll(status?: StudentEnrollmentStatus, pagination?: Pagination) {
    return this.prisma.studentEnrollment.findMany({
      where: status ? { status } : undefined,
      include: {
        student: { select: { id: true, email: true } },
        course: { select: { id: true, name: true } },
        selectedLevel: { select: { id: true, name: true } },
        assignedAssessment: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      ...pagination,
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, email: true } },
        course: true,
        selectedLevel: true,
        assignedAssessment: true,
        attempts: {
          select: { id: true, status: true, score: true, percentage: true, passed: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    return enrollment;
  }

  /** Admin: update enrollment status and optionally assign an assessment. */
  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = { status: dto.status };

    if (dto.assignedAssessmentId) {
      const assessment = await this.prisma.assessment.findUnique({
        where: { id: dto.assignedAssessmentId },
      });
      if (!assessment) {
        throw new NotFoundException(`Assessment ${dto.assignedAssessmentId} not found`);
      }
      data['assignedAssessmentId'] = dto.assignedAssessmentId;
    }

    return this.prisma.studentEnrollment.update({ where: { id }, data });
  }

  /** Admin: agree the fee - defaults to the student's proposal. */
  async resolveFee(id: string, dto: ResolveFeeDto) {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id },
      include: { course: { select: { name: true } } },
    });

    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    if (enrollment.feeStatus !== FeeStatus.PROPOSED) {
      throw new ConflictException(
        `Fee decision already made (status: ${enrollment.feeStatus})`,
      );
    }

    const agreedFee = dto.agreedFee ?? enrollment.proposedFee;
    if (agreedFee === null || agreedFee === undefined) {
      throw new BadRequestException('No proposed fee to agree on');
    }

    const updated = await this.prisma.studentEnrollment.update({
      where: { id },
      data: { agreedFee, feeStatus: FeeStatus.AGREED },
    });

    await this.notificationsService.create({
      recipientId: enrollment.studentId,
      message: `Your fee of ${agreedFee} for ${enrollment.course.name} was approved.`,
    });

    return updated;
  }

  /** Admin: decline the student's proposed fee. */
  async rejectFee(id: string) {
    const enrollment = await this.prisma.studentEnrollment.findUnique({
      where: { id },
      include: { course: { select: { name: true } } },
    });

    if (!enrollment) throw new NotFoundException(`Enrollment ${id} not found`);
    if (enrollment.feeStatus !== FeeStatus.PROPOSED) {
      throw new ConflictException(
        `Fee decision already made (status: ${enrollment.feeStatus})`,
      );
    }

    const updated = await this.prisma.studentEnrollment.update({
      where: { id },
      data: { agreedFee: null, feeStatus: FeeStatus.REJECTED },
    });

    await this.notificationsService.create({
      recipientId: enrollment.studentId,
      message: `Your proposed fee for ${enrollment.course.name} was declined.`,
    });

    return updated;
  }
}
