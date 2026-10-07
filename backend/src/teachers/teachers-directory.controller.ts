import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { TeachersService } from './teachers.service.js';

/**
 * Teacher directory. Kept separate from {@link TeachersController} because that
 * controller is restricted to the TEACHER role, while students need this list
 * in order to pick a teacher when creating an enrollment.
 */
@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/teachers')
export class TeachersDirectoryController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'List approved teachers (enrollment picker)' })
  @ApiQuery({ name: 'timeSlot', required: false })
  listApproved(@Query('timeSlot') timeSlot?: string) {
    return this.teachersService.listApproved(timeSlot);
  }
}
