import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TeacherApprovalGuard } from '../auth/guards/teacher-approval.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { CreateEnrollmentDto } from './enrollments.dto.js';
import { EnrollmentsService } from './enrollments.service.js';

@ApiTags('Enrollment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TeacherApprovalGuard)
@Roles(UserRole.STUDENT, UserRole.TEACHER)
@Controller('api/enrollment')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a pending enrollment request' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List enrollments for the authenticated student or teacher' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.list(user.sub, user.role);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Teacher accepts their own pending enrollment' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentsService.teacherResolve(user.sub, id, true);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Teacher declines their own pending enrollment' })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentsService.teacherResolve(user.sub, id, false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single enrollment the authenticated user participates in' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.enrollmentsService.getById(user.sub, user.role, id);
  }
}
