import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { StudentsModule } from '../students/students.module.js';
import { TeachersModule } from '../teachers/teachers.module.js';
import { EnrollmentsController } from './enrollments.controller.js';
import { EnrollmentsService } from './enrollments.service.js';

/**
 * @deprecated Legacy enrollment flow (Course enum + teacher approval).
 *
 * The canonical enrollment path is `StudentEnrollmentModule` (CourseItem UUIDs
 * + placement assessments). This module is frozen — no new features — but is
 * kept alive because `Attendance` and the legacy admin views still reference
 * the `Enrollment` model. Remove it once attendance is migrated to
 * `StudentEnrollment`.
 */
@Module({
  imports: [StudentsModule, TeachersModule, NotificationsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
