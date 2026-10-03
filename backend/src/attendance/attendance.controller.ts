import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TeacherApprovalGuard } from '../auth/guards/teacher-approval.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { RecordAttendanceDto } from './attendance.dto.js';
import { AttendanceService } from './attendance.service.js';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TeacherApprovalGuard)
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':enrollmentId')
  @Roles(UserRole.STUDENT, UserRole.TEACHER)
  @ApiOperation({ summary: 'List attendance records for an enrollment' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.attendanceService.list(user.sub, user.role, enrollmentId);
  }

  @Post()
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Create or update an attendance record (approved teachers only)' })
  record(@CurrentUser() user: AuthenticatedUser, @Body() dto: RecordAttendanceDto) {
    return this.attendanceService.record(user.sub, dto);
  }
}
