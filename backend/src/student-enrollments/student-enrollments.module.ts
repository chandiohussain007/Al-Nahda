import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StudentEnrollmentsController } from './student-enrollments.controller.js';
import { StudentEnrollmentsService } from './student-enrollments.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [StudentEnrollmentsController],
  providers: [StudentEnrollmentsService],
  exports: [StudentEnrollmentsService],
})
export class StudentEnrollmentsModule {}
