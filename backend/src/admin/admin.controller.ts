import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus, TeacherStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ListEnrollmentsQueryDto, ListTeachersQueryDto } from './admin.dto.js';
import { AdminService } from './admin.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('teachers')
  @ApiOperation({ summary: 'List teacher profiles with their approval status' })
  listTeachers(@Query() query: ListTeachersQueryDto) {
    return this.adminService.listTeachers(query.status);
  }

  @Patch('teachers/:id/approve')
  @ApiOperation({ summary: 'Approve a teacher application' })
  approveTeacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.setTeacherStatus(id, TeacherStatus.APPROVED);
  }

  @Patch('teachers/:id/reject')
  @ApiOperation({ summary: 'Reject a teacher application' })
  rejectTeacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.setTeacherStatus(id, TeacherStatus.REJECTED);
  }

  @Get('students')
  @ApiOperation({ summary: 'List student profiles' })
  listStudents() {
    return this.adminService.listStudents();
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get a student profile with enrollments and evaluations' })
  getStudent(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getStudent(id);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'List enrollment requests' })
  listEnrollments(@Query() query: ListEnrollmentsQueryDto) {
    return this.adminService.listEnrollments(query.status);
  }

  @Patch('enrollments/:id/approve')
  @ApiOperation({ summary: 'Activate an enrollment request' })
  approveEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.setEnrollmentStatus(id, EnrollmentStatus.ACTIVE);
  }

  @Patch('enrollments/:id/reject')
  @ApiOperation({ summary: 'Cancel an enrollment request' })
  rejectEnrollment(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.setEnrollmentStatus(id, EnrollmentStatus.CANCELLED);
  }
}
