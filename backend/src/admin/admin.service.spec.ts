import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentStatus, FeeStatus, TeacherStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminService } from './admin.service.js';

const prismaMock = {
  teacherProfile: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  studentProfile: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  enrollment: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
};

const notificationsServiceMock = { create: vi.fn() };

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
  });

  it('approves a teacher and notifies them', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ id: 't1', userId: 'u1' });
    prismaMock.teacherProfile.update.mockResolvedValue({
      id: 't1',
      teacherStatus: TeacherStatus.APPROVED,
    });

    await service.setTeacherStatus('t1', TeacherStatus.APPROVED);

    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { teacherStatus: TeacherStatus.APPROVED },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'u1' }),
    );
  });

  it('throws for an unknown teacher', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.setTeacherStatus('missing', TeacherStatus.APPROVED),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('activates an enrollment and notifies both student and teacher', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      courseName: 'LEARN_QURAN',
      student: { userId: 'student-user' },
      teacher: { userId: 'teacher-user' },
    });
    prismaMock.enrollment.update.mockResolvedValue({
      id: 'e1',
      status: EnrollmentStatus.ACTIVE,
    });

    await service.setEnrollmentStatus('e1', EnrollmentStatus.ACTIVE);

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: EnrollmentStatus.ACTIVE },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'student-user' }),
    );
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'teacher-user' }),
    );
  });

  it('overwrites a student profile picture by URL', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'sp1', userId: 'u1' });
    prismaMock.studentProfile.update.mockResolvedValue({
      id: 'sp1',
      profilePictureUrl: 'https://cdn.example.com/p.png',
    });

    await service.setProfilePicture('u1', 'https://cdn.example.com/p.png');

    expect(prismaMock.studentProfile.update).toHaveBeenCalledWith({
      where: { id: 'sp1' },
      data: { profilePictureUrl: 'https://cdn.example.com/p.png' },
    });
  });

  it('falls back to the teacher profile picture', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue(null);
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ id: 'tp1', userId: 'u1' });
    prismaMock.teacherProfile.update.mockResolvedValue({ id: 'tp1' });

    await service.setProfilePicture('u1', 'https://cdn.example.com/t.png');

    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith({
      where: { id: 'tp1' },
      data: { profilePictureUrl: 'https://cdn.example.com/t.png' },
    });
  });

  it('404s when no profile exists for the user', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue(null);
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);

    await expect(service.setProfilePicture('missing', 'https://cdn.example.com/p.png')).rejects
      .toBeInstanceOf(NotFoundException);
  });

  it("clears anyone's profile picture", async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({ id: 'sp1', userId: 'u1' });
    prismaMock.studentProfile.update.mockResolvedValue({ id: 'sp1', profilePictureUrl: null });

    await service.clearProfilePicture('u1');

    expect(prismaMock.studentProfile.update).toHaveBeenCalledWith({
      where: { id: 'sp1' },
      data: { profilePictureUrl: null },
    });
  });

  it("sets a teacher's CV link", async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ id: 'tp1', userId: 'u1' });
    prismaMock.teacherProfile.update.mockResolvedValue({ id: 'tp1', cvUrl: 'https://cdn.example.com/cv.pdf' });

    await service.setCv('u1', 'https://cdn.example.com/cv.pdf');

    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith({
      where: { id: 'tp1' },
      data: { cvUrl: 'https://cdn.example.com/cv.pdf' },
    });
  });

  it('404s when setting a CV on a non-teacher', async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue(null);

    await expect(service.setCv('u1', 'https://cdn.example.com/cv.pdf')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("clears a teacher's CV link", async () => {
    prismaMock.teacherProfile.findUnique.mockResolvedValue({ id: 'tp1', userId: 'u1' });
    prismaMock.teacherProfile.update.mockResolvedValue({ id: 'tp1', cvUrl: null });

    await service.clearCv('u1');

    expect(prismaMock.teacherProfile.update).toHaveBeenCalledWith({
      where: { id: 'tp1' },
      data: { cvUrl: null },
    });
  });

  it('agrees the proposed fee and notifies the student', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      proposedFee: 150,
      feeStatus: FeeStatus.PROPOSED,
      courseName: 'LEARN_QURAN',
      student: { userId: 'student-user' },
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'e1' });

    await service.resolveEnrollmentFee('e1', {});

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { agreedFee: 150, feeStatus: FeeStatus.AGREED },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'student-user' }),
    );
  });

  it('lets the admin counter-offer a different agreed fee', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      proposedFee: 150,
      feeStatus: FeeStatus.PROPOSED,
      courseName: 'LEARN_QURAN',
      student: { userId: 'student-user' },
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'e1' });

    await service.resolveEnrollmentFee('e1', { agreedFee: 120 });

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { agreedFee: 120, feeStatus: FeeStatus.AGREED },
    });
  });

  it('refuses to re-decide an already decided fee', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      proposedFee: 150,
      feeStatus: FeeStatus.AGREED,
      courseName: 'LEARN_QURAN',
      student: { userId: 'student-user' },
    });

    await expect(service.resolveEnrollmentFee('e1', {})).rejects.toBeInstanceOf(ConflictException);
    expect(prismaMock.enrollment.update).not.toHaveBeenCalled();
  });

  it('404s when the enrollment does not exist', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue(null);

    await expect(service.resolveEnrollmentFee('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects the proposed fee and notifies the student', async () => {
    prismaMock.enrollment.findUnique.mockResolvedValue({
      id: 'e1',
      proposedFee: 150,
      feeStatus: FeeStatus.PROPOSED,
      courseName: 'LEARN_ARABIC',
      student: { userId: 'student-user' },
    });
    prismaMock.enrollment.update.mockResolvedValue({ id: 'e1' });

    await service.rejectEnrollmentFee('e1');

    expect(prismaMock.enrollment.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { agreedFee: null, feeStatus: FeeStatus.REJECTED },
    });
    expect(notificationsServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'student-user' }),
    );
  });
});
