import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpsertStudentProfileDto {
  @ApiProperty({ example: 'Aisha Rahman' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ example: '+971500000000' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  whatsappNumber?: string;

  @ApiPropertyOptional({ example: 'Learning Quran recitation.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
