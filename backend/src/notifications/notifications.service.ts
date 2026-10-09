import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Pagination } from '../common/pagination.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateNotificationInput {
  recipientId: string;
  message: string;
  senderId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    const recipient = await this.prisma.user.findUnique({
      where: { id: input.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('Notification recipient not found');
    }

    return this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        senderId: input.senderId ?? null,
        message: input.message,
      },
    });
  }

  listForUser(userId: string, pagination?: Pagination) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      ...pagination,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
