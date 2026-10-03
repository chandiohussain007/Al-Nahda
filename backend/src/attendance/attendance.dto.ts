import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsUUID } from 'class-validator';

export class RecordAttendanceDto {
  @ApiProperty({ description: 'Enrollment id the attendance belongs to' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ example: '2026-03-10T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}
