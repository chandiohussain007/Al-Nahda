import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { SaveAnswerDto, StartAttemptDto } from './attempts.dto.js';
import { AttemptsService } from './attempts.service.js';

@ApiTags('Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('api/attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new attempt for an assessment' })
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: StartAttemptDto) {
    return this.attemptsService.start(user.sub, {
      assessmentId: dto.assessmentId,
      enrollmentId: dto.enrollmentId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all my attempts' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.attemptsService.listMyAttempts(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attempt details and result' })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attemptsService.getAttempt(user.sub, id);
  }

  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update answer for one question mid-attempt' })
  saveAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.attemptsService.saveAnswer(user.sub, id, {
      questionId: dto.questionId,
      selectedOptionId: dto.selectedOptionId,
    });
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit attempt for grading' })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.attemptsService.submit(user.sub, id);
  }
}
