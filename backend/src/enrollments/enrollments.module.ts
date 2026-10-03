import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { StudentsModule } from '../students/students.module.js';
import { TeachersModule } from '../teachers/teachers.module.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

@Module({
  imports: [StudentsModule, TeachersModule, NotificationsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
