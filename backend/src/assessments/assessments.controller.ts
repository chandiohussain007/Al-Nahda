import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { AddQuestionsDto, CreateAssessmentDto, UpdateAssessmentDto } from './assessments.dto.js';
import { AssessmentsService } from './assessments.service.js';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new assessment' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(dto, user.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'List all assessments' })
  findAll() {
    return this.assessmentsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get assessment details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assessmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update assessment metadata' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.update(id, dto);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish an assessment (requires at least 1 question)' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.assessmentsService.publish(id);
  }

  @Post(':id/questions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set the ordered question list for an assessment' })
  addQuestions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddQuestionsDto) {
    return this.assessmentsService.addQuestions(id, dto);
  }
}
