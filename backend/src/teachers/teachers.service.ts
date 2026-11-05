import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import type { Pagination } from '../common/pagination.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { findUsersByIdsOrNumbers } from '../common/user-id.util.js';
import { SendTeacherNotificationDto, UpsertTeacherProfileDto } from './teachers.dto.js';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Teacher profile not found. Create one via PUT /api/teacher/profile.',
      );
    }

    return profile;
  }

  upsertProfile(userId: string, dto: UpsertTeacherProfileDto) {
    return this.prisma.teacherProfile.upsert({
      where: { userId },
      create: { userId, ...Object.assign({}, dto) },
      update: Object.assign({}, dto),
    });
  }

  /**
   * Directory of approved teachers used by students when creating an
   * enrollment. Selects profile fields only, so user emails are never
   * exposed to other accounts.
   */
  listApproved(timeSlot?: string, pagination?: Pagination) {
    return this.prisma.teacherProfile.findMany({
      where: {
        teacherStatus: TeacherStatus.APPROVED,
        ...(timeSlot ? { availableTimeSlots: { has: timeSlot } } : {}),
      },
      select: {
        id: true,
        fullName: true,
        profilePictureUrl: true,
        bio: true,
        qualifications: true,
        experienceYears: true,
        subjectsTaught: true,
        availableTimeSlots: true,
      },
      orderBy: { fullName: 'asc' },
      ...pagination,
    });
  }

  async sendNotification(senderId: string, dto: SendTeacherNotificationDto) {
    // 1. Get the teacher's profile to inspect their enrolled students
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: senderId },
      include: {
        enrollments: {
          include: {
            student: { select: { userId: true } },
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const enrolledStudentUserIds = new Set(
      teacher.enrollments.map((e) => e.student.userId),
    );

    // 2. Parse target IDs (can be comma-separated 4-digit IDs or UUIDs)
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

    // 3. Teachers can only send to students enrolled in their course
    for (const recipient of matchedUsers) {
      if (!enrolledStudentUserIds.has(recipient.id)) {
        throw new ForbiddenException(
          `User ${recipient.userIdNumber} is not enrolled in any of your courses. You may only message students enrolled in your courses.`,
        );
      }
    }

    // 4. Send notification to each validated recipient
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