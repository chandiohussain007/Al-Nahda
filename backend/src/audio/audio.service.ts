import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfirmAudioUploadDto, PresignedUploadDto, ReviewAudioDto } from './audio.dto.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AudioService {
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') ?? 'al-nahda-audio';
    this.publicBaseUrl = (
      this.configService.get<string>('R2_PUBLIC_URL') ??
      'https://pub-051b8268804b45fba0ce8a4bf5a4866b.r2.dev'
    ).replace(/\/+$/, '');

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async getPresignedUploadUrl(userId: string, dto: PresignedUploadDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { student: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.student.userId !== userId) {
      throw new ForbiddenException('You can only upload audio for your own enrollment');
    }

    const objectKey = `homework/${enrollment.id}/${Date.now()}-${randomUUID()}.webm`;

    if (!this.s3Client) {
      // In dev/mock mode if R2 creds are not yet set
      return {
        uploadUrl: `${this.publicBaseUrl}/${objectKey}`,
        objectKey,
        publicUrl: `${this.publicBaseUrl}/${objectKey}`,
        mock: true,
      };
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        ContentType: dto.contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 600 });

      return {
        uploadUrl,
        objectKey,
        publicUrl: `${this.publicBaseUrl}/${objectKey}`,
        mock: false,
      };
    } catch (err: unknown) {
      throw new InternalServerErrorException(
        `Failed to generate upload URL: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  async confirmUpload(userId: string, dto: ConfirmAudioUploadDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { student: true },
    });

    if (!enrollment || enrollment.student.userId !== userId) {
      throw new ForbiddenException('Invalid enrollment');
    }

    const publicUrl = `${this.publicBaseUrl}/${dto.r2ObjectKey}`;

    return this.prisma.audioSubmission.create({
      data: {
        enrollmentId: dto.enrollmentId,
        studentId: enrollment.student.id,
        r2ObjectKey: dto.r2ObjectKey,
        publicUrl,
        durationSec: dto.durationSec,
      },
    });
  }

  async getEnrollmentAudios(enrollmentId: string, userId: string, role: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true, teacher: true },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (role === 'STUDENT' && enrollment.student.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'TEACHER' && enrollment.teacher.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.audioSubmission.findMany({
      where: { enrollmentId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async reviewAudio(id: string, teacherUserId: string, dto: ReviewAudioDto) {
    const submission = await this.prisma.audioSubmission.findUnique({
      where: { id },
      include: { enrollment: { include: { teacher: true } } },
    });

    if (!submission) throw new NotFoundException('Audio submission not found');

    if (submission.enrollment.teacher.userId !== teacherUserId) {
      throw new ForbiddenException('Only the assigned teacher can review this homework');
    }

    return this.prisma.audioSubmission.update({
      where: { id },
      data: {
        teacherNote: dto.teacherNote,
        reviewedAt: new Date(),
      },
    });
  }

  /** Daily retention cleanup — deletes audio recordings older than 30 days */
  async cleanupOldAudio() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expired = await this.prisma.audioSubmission.findMany({
      where: { uploadedAt: { lt: thirtyDaysAgo } },
      take: 50,
    });

    let deletedCount = 0;
    for (const item of expired) {
      if (this.s3Client) {
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.bucketName,
              Key: item.r2ObjectKey,
            }),
          );
        } catch {
          // Continue with DB deletion even if cloud deletion errors
        }
      }
      await this.prisma.audioSubmission.delete({ where: { id: item.id } });
      deletedCount++;
    }

    return { deleted: deletedCount };
  }
}
