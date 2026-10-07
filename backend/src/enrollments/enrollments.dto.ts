import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Course, Level } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'Teacher profile id to enroll with' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ enum: Course })
  @IsEnum(Course)
  courseName: Course;

  @ApiProperty({ example: 'Mon/Wed 18:00-19:00' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  preferredTimeSlot: string;

  @ApiPropertyOptional({
    description: 'Completed evaluation test id. When supplied, the assigned level is used.',
  })
  @IsOptional()
  @IsUUID()
  evaluationTestId?: string;

  @ApiPropertyOptional({ enum: Level })
  @IsOptional()
  @IsEnum(Level)
  confirmedLevel?: Level;

  @ApiPropertyOptional({
    description: 'Fee the student proposes in whole units; admin approves or rejects it',
    example: 150,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  proposedFee?: number;
}