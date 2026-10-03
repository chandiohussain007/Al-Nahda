import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from './notifications.service.js';

const prismaMock = {
  user: { findUnique: vi.fn() },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = moduleRef.get(NotificationsService);
  });

  it('rejects creating a notification for a missing recipient', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ recipientId: 'missing', message: 'hello' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a notification with a null sender when omitted', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2' });
    prismaMock.notification.create.mockResolvedValue({ id: 'n1' });

    await service.create({ recipientId: 'user-2', message: 'hello' });

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: { recipientId: 'user-2', senderId: null, message: 'hello' },
    });
  });

  it('prevents a user from reading another user notification', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 'n1', recipientId: 'other' });

    await expect(service.markAsRead('user-1', 'n1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.notification.update).not.toHaveBeenCalled();
  });

  it('marks the notification as read for the owner', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 'n1', recipientId: 'user-1' });
    prismaMock.notification.update.mockResolvedValue({ id: 'n1', isRead: true });

    await service.markAsRead('user-1', 'n1');

    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: 'n1' },
      data: { isRead: true },
    });
  });
});
