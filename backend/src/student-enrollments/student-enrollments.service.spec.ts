import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FeeStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StudentEnrollmentsService } from './student-enrollments.service.js';

const prismaMock = {
  courseItem: { findUnique: vi.fn() },
  studentEnrollment: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

const notificationsServiceMock = { create: vi.fn() };

describe('StudentEnrollmentsService', () => {
  let service: StudentEnrollmentsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentEnrollmentsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = moduleRef.get(StudentEnrollmentsService);
  });

  describe('apply', () => {
    it('marks the fee as PROPOSED when the student proposes one', async () => {
      prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'c1', status: 'PUBLISHED' });
      prismaMock.studentEnrollment.findFirst.mockResolvedValue(null);
      prismaMock.studentEnrollment.create.mockResolvedValue({ id: 'se1' });

      await service.apply('user-1', { courseId: 'c1', proposedFee: 150 });

      expect(prismaMock.studentEnrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proposedFee: 150,
            feeStatus: FeeStatus.PROPOSED,
          }),
        }),
      );
    });

    it('leaves the fee at NONE when no proposal is made', async () => {
      prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'c1', status: 'PUBLISHED' });
      prismaMock.studentEnrollment.findFirst.mockResolvedValue(null);
      prismaMock.studentEnrollment.create.mockResolvedValue({ id: 'se1' });

      await service.apply('user-1', { courseId: 'c1' });

      expect(prismaMock.studentEnrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ proposedFee: null, feeStatus: FeeStatus.NONE }),
        }),
      );
    });

    it('refuses to apply to an unpublished course', async () => {
      prismaMock.courseItem.findUnique.mockResolvedValue({ id: 'c1', status: 'DRAFT' });

      await expect(service.apply('user-1', { courseId: 'c1' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prismaMock.studentEnrollment.create).not.toHaveBeenCalled();
    });
  });

  describe('resolveFee', () => {
    const proposed = {
      id: 'se1',
      studentId: 'student-user',
      proposedFee: 150,
      feeStatus: FeeStatus.PROPOSED,
      course: { name: 'Arabic Basics' },
    };

    it('agrees the proposed fee when the admin sends no counter', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue(proposed);
      prismaMock.studentEnrollment.update.mockResolvedValue({ id: 'se1' });

      await service.resolveFee('se1', {});

      expect(prismaMock.studentEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'se1' },
        data: { agreedFee: 150, feeStatus: FeeStatus.AGREED },
      });
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientId: 'student-user' }),
      );
    });

    it('lets the admin counter-offer a different fee', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue(proposed);
      prismaMock.studentEnrollment.update.mockResolvedValue({ id: 'se1' });

      await service.resolveFee('se1', { agreedFee: 120 });

      expect(prismaMock.studentEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'se1' },
        data: { agreedFee: 120, feeStatus: FeeStatus.AGREED },
      });
    });

    it('refuses to re-decide an already decided fee', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue({
        ...proposed,
        feeStatus: FeeStatus.AGREED,
      });

      await expect(service.resolveFee('se1', {})).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.studentEnrollment.update).not.toHaveBeenCalled();
    });

    it('404s when the enrollment does not exist', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.resolveFee('missing', {})).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400s when nothing was ever proposed', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue({
        ...proposed,
        proposedFee: null,
      });

      await expect(service.resolveFee('se1', {})).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.studentEnrollment.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectFee', () => {
    it('marks the fee REJECTED and clears any agreed amount', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue({
        id: 'se1',
        studentId: 'student-user',
        proposedFee: 150,
        feeStatus: FeeStatus.PROPOSED,
        course: { name: 'Arabic Basics' },
      });
      prismaMock.studentEnrollment.update.mockResolvedValue({ id: 'se1' });

      await service.rejectFee('se1');

      expect(prismaMock.studentEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'se1' },
        data: { agreedFee: null, feeStatus: FeeStatus.REJECTED },
      });
      expect(notificationsServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ recipientId: 'student-user' }),
      );
    });

    it('refuses to reject twice', async () => {
      prismaMock.studentEnrollment.findUnique.mockResolvedValue({
        id: 'se1',
        studentId: 'student-user',
        feeStatus: FeeStatus.REJECTED,
        course: { name: 'Arabic Basics' },
      });

      await expect(service.rejectFee('se1')).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.studentEnrollment.update).not.toHaveBeenCalled();
    });
  });
});