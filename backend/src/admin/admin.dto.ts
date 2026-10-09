import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus, TeacherStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUrl, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../common/pagination.dto.js';

export class ListTeachersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TeacherStatus, description: 'Filter teachers by approval status' })
  @IsOptional()
  @IsEnum(TeacherStatus)
  status?: TeacherStatus;
}

export class ListStudentsQueryDto extends PaginationQueryDto {}

export class ListEnrollmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus, description: 'Filter enrollments by status' })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}

/** Admin sets the final fee — never taken from the student. */
export class ResolveFeeDto {
  @ApiPropertyOptional({
    description: 'Final agreed fee in whole units; defaults to the proposed fee when omitted',
    example: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  agreedFee?: number;
}

/** Admin supplies a direct web link — no file upload required. */
export class SetProfilePictureDto {
  @ApiProperty({ description: 'Direct web link to the image', example: 'https://example.com/avatar.png' })
  @IsUrl({ require_protocol: true })
  profilePictureUrl: string;
}

export class SetCvDto {
  @ApiProperty({ description: 'Direct web link to the CV (image or PDF)', example: 'https://example.com/cv.pdf' })
  @IsUrl({ require_protocol: true })
  cvUrl: string;
}