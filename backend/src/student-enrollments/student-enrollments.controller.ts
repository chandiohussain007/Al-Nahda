import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ResolveFeeDto } from '../admin/admin.dto.js';
import { PaginationQueryDto } from '../common/pagination.dto.js';
import {
  CreateStudentEnrollmentDto,
  ListStudentEnrollmentsQueryDto,
  UpdateEnrollmentStatusDto,
} from './student-enrollments.dto.js';
import { StudentEnrollmentsService } from './student-enrollments.service.js';

@ApiTags('Student Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/student-enrollments')
export class StudentEnrollmentsController {
  constructor(private readonly service: StudentEnrollmentsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Apply for a course enrollment' })
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentEnrollmentDto) {
    return this.service.apply(user.sub, dto);
  }

  @Get('mine')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'List my own enrollment applications' })
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.service.listMine(user.sub, { skip: query.skip, take: query.take });
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: list all enrollments' })
  listAll(@Query() query: ListStudentEnrollmentsQueryDto) {
    return this.service.listAll(query.status, { skip: query.skip, take: query.take });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get enrollment details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: update enrollment status / assign assessment' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/fee/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: agree the fee (defaults to the proposed amount)' })
  approveFee(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResolveFeeDto) {
    return this.service.resolveFee(id, dto);
  }

  @Patch(':id/fee/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: reject the proposed fee' })
  rejectFee(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.rejectFee(id);
  }
}
