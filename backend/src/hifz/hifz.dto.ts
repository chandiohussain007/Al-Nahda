import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordHifzProgressDto {
  @ApiProperty({ description: 'Enrollment ID' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  // Sabaq (New lesson)
  @ApiPropertyOptional({ description: 'Surah number' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(114)
  sabaqSurah?: number;

  @ApiPropertyOptional({ description: 'Starting Ayah' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sabaqFrom?: number;

  @ApiPropertyOptional({ description: 'Ending Ayah' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sabaqTo?: number;

  // Sabqi (Recent revision)
  @ApiPropertyOptional({ description: 'Sabqi Surah' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(114)
  sabqiSurah?: number;

  @ApiPropertyOptional({ description: 'Sabqi From' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sabqiFrom?: number;

  @ApiPropertyOptional({ description: 'Sabqi To' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sabqiTo?: number;

  // Manzil (Past revision)
  @ApiPropertyOptional({ description: 'Manzil Surah' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(114)
  manzilSurah?: number;

  @ApiPropertyOptional({ description: 'Manzil From' })
  @IsOptional()
  @IsInt()
  @Min(1)
  manzilFrom?: number;

  @ApiPropertyOptional({ description: 'Manzil To' })
  @IsOptional()
  @IsInt()
  @Min(1)
  manzilTo?: number;

  @ApiPropertyOptional({ description: 'Teacher notes and tips' })
  @IsOptional()
  @IsString()
  teacherNotes?: string;
}
