import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { EvaluationQuestionsQueryDto, SubmitEvaluationDto } from './evaluations.dto.js';
import { EvaluationsService } from './evaluations.service.js';

@ApiTags('Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('api/test')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('questions')
  @ApiOperation({ summary: 'List evaluation questions for a course and level' })
  getQuestions(@Query() query: EvaluationQuestionsQueryDto) {
    return this.evaluationsService.listQuestions(query.course, query.level);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Submit an evaluation test for scoring and level placement' })
  evaluate(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitEvaluationDto) {
    return this.evaluationsService.submit(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a previously completed evaluation test' })
  getTest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.evaluationsService.getTest(user.sub, id);
  }
}
