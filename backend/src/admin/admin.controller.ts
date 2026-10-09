import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus, TeacherStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import {
  ListEnrollmentsQueryDto,
  ListStudentsQueryDto,
  ListTeachersQueryDto,
  ResolveFeeDto,
  SetCvDto,
  SetProfilePictureDto,
} from './admin.dto.js';
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
    return this.adminService.listTeachers(query.status, {
      skip: query.skip,
      take: query.take,
    });
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
  listStudents(@Query() query: ListStudentsQueryDto) {
    return this.adminService.listStudents({ skip: query.skip, take: query.take });
  }

  @Get('students/:id')
  @ApiOperation({ summary: 'Get a student profile with enrollments and evaluations' })
  getStudent(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getStudent(id);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'List enrollment requests' })
  listEnrollments(@Query() query: ListEnrollmentsQueryDto) {
    return this.adminService.listEnrollments(query.status, {
      skip: query.skip,
      take: query.take,
    });
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

  @Patch('enrollments/:id/fee/approve')
  @ApiOperation({ summary: 'Agree the fee on an enrollment (defaults to the proposed amount)' })
  approveEnrollmentFee(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveFeeDto) {
    return this.adminService.resolveEnrollmentFee(id, dto);
  }

  @Patch('enrollments/:id/fee/reject')
  @ApiOperation({ summary: 'Reject the proposed fee on an enrollment' })
  rejectEnrollmentFee(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.rejectEnrollmentFee(id);
  }

  @Patch('users/:id/profile-picture')
  @ApiOperation({ summary: 'Overwrite a profile picture by direct web link' })
  setProfilePicture(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetProfilePictureDto) {
    return this.adminService.setProfilePicture(id, dto.profilePictureUrl);
  }

  @Delete('users/:id/profile-picture')
  @ApiOperation({ summary: 'Clear a profile picture' })
  clearProfilePicture(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.clearProfilePicture(id);
  }

  @Patch('users/:id/cv')
  @ApiOperation({ summary: "Set a teacher's CV link by direct web link" })
  setCv(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetCvDto) {
    return this.adminService.setCv(id, dto.cvUrl);
  }

  @Delete('users/:id/cv')
  @ApiOperation({ summary: "Clear a teacher's CV link" })
  clearCv(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.clearCv(id);
  }
}
