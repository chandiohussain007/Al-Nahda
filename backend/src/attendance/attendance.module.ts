import { Module } from '@nestjs/common';
import { TeachersModule } from '../teachers/teachers.module.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';

@Module({
  imports: [TeachersModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
