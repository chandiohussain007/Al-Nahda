import { Injectable, NotFoundException } from '@nestjs/common';
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
      create: { userId, ...dto },
      update: { ...dto },
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
