import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { StudentEnrollmentStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentEnrollmentDto {
  @ApiProperty({ description: 'CourseItem ID to enroll in' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ description: 'Preferred level ID' })
  @IsOptional()
  @IsUUID()
  selectedLevelId?: string;

  @ApiPropertyOptional({ description: 'Any additional application data (JSON string or text)' })
  @IsOptional()
  @IsString()
  applicationData?: string;

  @ApiPropertyOptional({
    description: 'Fee the student proposes in whole units; admin approves or rejects it',
    example: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  proposedFee?: number;
}

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ enum: StudentEnrollmentStatus })
  @IsEnum(StudentEnrollmentStatus)
  status: StudentEnrollmentStatus;

  @ApiPropertyOptional({ description: 'Assessment to assign when requiring one' })
  @IsOptional()
  @IsUUID()
  assignedAssessmentId?: string;
}