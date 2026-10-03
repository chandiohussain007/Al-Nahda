import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus, TeacherStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListTeachersQueryDto {
  @ApiPropertyOptional({ enum: TeacherStatus, description: 'Filter teachers by approval status' })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;
}

export class ListEnrollmentsQueryDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus, description: 'Filter enrollments by status' })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
