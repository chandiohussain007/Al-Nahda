import { ApiProperty } from '@nestjs/swagger';
import { Course, Level } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class EvaluationAnswerDto {
  @ApiProperty({ description: 'Evaluation question id' })
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: 'A' })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class SubmitEvaluationDto {
  @ApiProperty({ enum: Course })
  @IsEnum(Course)
  course: Course;

  @ApiProperty({ enum: Level, description: 'Level the student believes they are at' })
  @IsEnum(Level)
  claimedLevel: Level;

  @ApiProperty({ type: [EvaluationAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => EvaluationAnswerDto)
  answers: EvaluationAnswerDto[];
}

export class EvaluationQuestionsQueryDto {
  @ApiProperty({ enum: Course })
  @IsEnum(Course)
  course: Course;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;
}
