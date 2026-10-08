import { Injectable, NotFoundException } from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
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
  listApproved(timeSlot?: string) {
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
    });
  }

  sendNotification(senderId: string, dto: SendTeacherNotificationDto) {
    return this.notificationsService.create({
      recipientId: dto.recipientId,
      senderId,
      message: dto.message,
    });
  }
}
