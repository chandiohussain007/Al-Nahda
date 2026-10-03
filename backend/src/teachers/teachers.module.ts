import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TeachersController } from './teachers.controller.js';
import { TeachersService } from './teachers.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
