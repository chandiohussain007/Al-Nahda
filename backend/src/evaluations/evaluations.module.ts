import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module.js';
import { EvaluationsController } from './evaluations.controller.js';
import { EvaluationsService } from './evaluations.service.js';

@Module({
  imports: [StudentsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
