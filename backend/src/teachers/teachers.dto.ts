import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../common/pagination.dto.js';

/** Filters + pagination for the approved-teacher directory. */
export class ListApprovedTeachersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only teachers available during this time slot' })
  @IsOptional()
  @IsString()
  timeSlot?: string;
}

export class UpsertTeacherProfileDto {
  @ApiProperty({ example: 'Sheikh Yusuf Ali' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ example: 'Ijazah holder in Quran recitation.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({ type: [String], example: ['Ijazah in Hafs'] })
  @IsArray()
  @IsString({ each: true })
  qualifications: string[];

  @ApiProperty({ example: 8 })
  @IsInt()
  @Min(0)
  @Max(80)
  experienceYears: number;

  @ApiProperty({ type: [String], example: ['LEARN_QURAN', 'LEARN_ARABIC'] })
  @IsArray()
  @IsString({ each: true })
  subjectsTaught: string[];

  @ApiPropertyOptional({
    description: 'Contact phone; returned to ADMIN and the owner only',
    example: '+92 300 1234567',
  })
  @IsOptional()
  @Matches(/^\+?[0-9 ()-]{7,20}$/, {
    message: 'phoneNumber must be 7-20 digits with optional +, spaces, parentheses or dashes',
  })
  phoneNumber?: string | null;

  @ApiPropertyOptional({ description: 'Direct web link to the CV', example: 'https://example.com/cv.pdf' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  cvUrl?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['09:00 AM - 10:00 AM', '04:00 PM - 05:00 PM'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableTimeSlots?: string[];
}

export class SendTeacherNotificationDto {
  @ApiProperty({ description: 'User id of the notification recipient' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ example: 'Class moved to 6pm tomorrow.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}