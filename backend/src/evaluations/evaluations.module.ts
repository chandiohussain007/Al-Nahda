import { Module } from '@nestjs/common';
import { StudentsModule } from '../students/students.module.js';
import { EvaluationsController } from './evaluations.controller.js';
import { EvaluationsService } from './evaluations.service.js';

/**
 * @deprecated Legacy placement evaluations (`EvaluationQuestion`/`EvaluationTest`).
 *
 * Scheduled for replacement by the `AssessmentsModule` + `AttemptsModule`
 * pipeline (question bank with per-question ids, timed attempts, automated
 * grading). Frozen for now: the student dashboard placement test and its
 * seeds still depend on it. Do not add new features here.
 */
@Module({
  imports: [StudentsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
