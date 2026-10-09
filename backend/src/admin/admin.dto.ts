import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus, EnrollmentStatus, TeacherStatus } from '@prisma/client';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
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

export class SetUserActiveDto {
  @ApiProperty({ description: 'Whether the account is allowed to sign in and use the platform' })
  @IsBoolean()
  isActive!: boolean;
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Quran Reading' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'quran-reading' })
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiPropertyOptional({ description: 'Optional public course description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  standardFee?: number | null;

  @ApiPropertyOptional({ enum: CourseStatus, default: CourseStatus.DRAFT })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Quran Reading' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'quran-reading' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional({ description: 'Optional public course description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  standardFee?: number | null;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}