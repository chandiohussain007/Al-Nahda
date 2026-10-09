import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class StudentRegistrationDto {
  @ApiProperty({ example: 'Aisha Rahman' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'aisha@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Learn Quran' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  preferredCourse: string;
}

export class TeacherApplicationDto {
  @ApiProperty({ example: 'Omar Hassan' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ example: 'omar@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: '+971500000000' })
  @IsString()
  @MinLength(5)
  @MaxLength(40)
  phoneNumber: string;

  @ApiProperty({ example: 'Arabic, Quran recitation' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'Five years teaching Arabic to adult learners.' })
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  experience: string;
}
