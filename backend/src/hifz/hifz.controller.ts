import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HifzService } from './hifz.service.js';
import { RecordHifzProgressDto } from './hifz.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@ApiTags('Hifz')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/hifz')
export class HifzController {
  constructor(private readonly hifzService: HifzService) {}

  @Post('record')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Teacher records daily Sabaq, Sabqi, and Manzil progress' })
  async recordProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordHifzProgressDto,
  ) {
    return this.hifzService.recordProgress(user.sub, dto);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get daily Hifz progress records for an enrollment' })
  async getEnrollmentProgress(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.hifzService.getProgressForEnrollment(enrollmentId, user.sub, user.role);
  }
}
