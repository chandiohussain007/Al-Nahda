import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  StudentRegistrationDto,
  TeacherApplicationDto,
} from './public-applications.dto.js';
import { PublicApplicationsService } from './public-applications.service.js';

@ApiTags('Public applications')
@Controller('api/public')
export class PublicApplicationsController {
  constructor(private readonly applicationsService: PublicApplicationsService) {}

  @Post('student-registration')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a student registration request to Al Nahda' })
  async submitStudentRegistration(@Body() dto: StudentRegistrationDto) {
    await this.applicationsService.submitStudentRegistration(dto);
    return { message: 'Your registration request has been sent.' };
  }

  @Post('teacher-application')
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a teacher application to Al Nahda' })
  async submitTeacherApplication(@Body() dto: TeacherApplicationDto) {
    await this.applicationsService.submitTeacherApplication(dto);
    return { message: 'Your teacher application has been sent.' };
  }
}
