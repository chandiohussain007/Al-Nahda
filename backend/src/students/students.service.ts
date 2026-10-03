import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpsertStudentProfileDto } from './students.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Student profile not found. Create one via PUT /api/student/profile.',
      );
    }

    return profile;
  }

  upsertProfile(userId: string, dto: UpsertStudentProfileDto) {
    return this.prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async getProgress(userId: string) {
    const profile = await this.getProfile(userId);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: profile.id },
      include: {
        attendance: true,
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const evaluations = await this.prisma.evaluationTest.findMany({
      where: { studentId: profile.id },
      orderBy: { startedAt: 'desc' },
      take: 5,
    });

    const attendanceSummary: Record<AttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      EXCUSED: 0,
    };

    for (const enrollment of enrollments) {
      for (const record of enrollment.attendance) {
        attendanceSummary[record.status] += 1;
      }
    }

    const totalSessions =
      attendanceSummary.PRESENT + attendanceSummary.ABSENT + attendanceSummary.EXCUSED;

    return {
      studentId: profile.id,
      fullName: profile.fullName,
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter((e) => e.status === EnrollmentStatus.ACTIVE).length,
      attendance: {
        ...attendanceSummary,
        totalSessions,
        attendanceRate:
          totalSessions === 0
            ? 0
            : Math.round((attendanceSummary.PRESENT / totalSessions) * 100),
      },
      latestEvaluations: evaluations,
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        courseName: enrollment.courseName,
        confirmedLevel: enrollment.confirmedLevel,
        status: enrollment.status,
        teacher: enrollment.teacher,
        createdAt: enrollment.createdAt,
      })),
    };
  }
}
