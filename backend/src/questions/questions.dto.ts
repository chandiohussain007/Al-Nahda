import { IsEnum, IsInt, IsJSON, IsOptional, IsString, Min } from 'class-validator';
import { Course, Difficulty, Level, QuestionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/pagination.dto.js';

/** Filters + pagination for the question-bank listing. */
export class ListQuestionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Course, description: 'Filter by course' })
  @IsOptional()
  @IsEnum(Course)
  course?: Course;

  @ApiPropertyOptional({ enum: Level, description: 'Filter by level' })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({ enum: Difficulty, description: 'Filter by difficulty' })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Question text' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ enum: QuestionType, default: QuestionType.MULTIPLE_CHOICE })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ enum: Difficulty, default: Difficulty.MEDIUM })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiProperty({ enum: Course })
  @IsEnum(Course)
  course: Course;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;

  @ApiProperty({ description: 'JSON array of { id, text } option objects' })
  @IsJSON()
  options: string; // raw JSON string — parsed by service

  @ApiProperty({ description: 'The id of the correct option' })
  @IsString()
  correctOptionId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsJSON()
  options?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correctOptionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;
}
