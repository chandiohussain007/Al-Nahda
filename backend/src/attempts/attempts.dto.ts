import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartAttemptDto {
  @ApiProperty({ description: 'Assessment to attempt' })
  @IsUUID()
  assessmentId: string;

  @ApiPropertyOptional({ description: 'Related StudentEnrollment ID (optional)' })
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;
}

export class SaveAnswerDto {
  @ApiProperty({ description: 'Question ID being answered' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ description: 'Selected option ID — null to clear answer' })
  @IsOptional()
  @IsString()
  selectedOptionId: string | null;
}
