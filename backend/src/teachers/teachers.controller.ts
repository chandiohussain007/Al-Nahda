import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { TeacherApprovalGuard } from '../auth/guards/teacher-approval.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { SendTeacherNotificationDto, UpsertTeacherProfileDto } from './teachers.dto.js';
import { TeachersService } from './teachers.service.js';

@ApiTags('Teacher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller('api/teacher')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get the authenticated teacher profile (works while approval is pending)',
  })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Create or update the authenticated teacher profile' })
  upsertProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertTeacherProfileDto,
  ) {
    return this.teachersService.upsertProfile(user.sub, dto);
  }

  @Post('notifications')
  @UseGuards(TeacherApprovalGuard)
  @ApiOperation({ summary: 'Send a notification to a student or teacher (approved teachers only)' })
  sendNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendTeacherNotificationDto,
  ) {
    return this.teachersService.sendNotification(user.sub, dto);
  }
}
