import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { UpsertStudentProfileDto } from './students.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('Student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('api/student')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated student profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Create or update the authenticated student profile' })
  upsertProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertStudentProfileDto,
  ) {
    return this.studentsService.upsertProfile(user.sub, dto);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get attendance and evaluation progress for the student' })
  getProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getProgress(user.sub);
  }
}
