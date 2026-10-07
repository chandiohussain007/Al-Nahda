import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AttemptsController } from './attempts.controller.js';
import { AttemptsService } from './attempts.service.js';
import { GradingService } from './grading.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, GradingService],
  exports: [AttemptsService, GradingService],
})
export class AttemptsModule {}
