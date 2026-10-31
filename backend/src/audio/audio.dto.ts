import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignedUploadDto {
  @ApiProperty({ description: 'Enrollment ID this audio submission belongs to' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ description: 'File content type (e.g. audio/webm or audio/ogg)' })
  @IsString()
  @IsNotEmpty()
  contentType: string;
}

export class ConfirmAudioUploadDto {
  @ApiProperty({ description: 'Enrollment ID' })
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ description: 'The R2 object key returned during upload initialization' })
  @IsString()
  @IsNotEmpty()
  r2ObjectKey: string;

  @ApiPropertyOptional({ description: 'Audio duration in seconds' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  durationSec?: number;
}

export class ReviewAudioDto {
  @ApiProperty({ description: 'Teacher feedback / correction note' })
  @IsString()
  @IsNotEmpty()
  teacherNote: string;
}
