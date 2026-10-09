import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { AttemptsModule } from './attempts/attempts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { CoursesModule } from './courses/courses.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { EvaluationsModule } from './evaluations/evaluations.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicApplicationsModule } from './public-applications/public-applications.module.js';
import { QuestionsModule } from './questions/questions.module.js';
import { StudentEnrollmentsModule } from './student-enrollments/student-enrollments.module.js';
import { StudentsModule } from './students/students.module.js';
import { TeachersModule } from './teachers/teachers.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        // One request per second averaged over the window, generous enough for
        // a normal user browsing the dashboard, tight enough to blunt scrapers.
        ttl: 60_000,
        limit: 600,
      },
    ]),
    PrismaModule,
    PublicApplicationsModule,
    UsersModule,
    AuthModule,
    HealthModule,
    AdminModule,
    StudentsModule,
    TeachersModule,
    EvaluationsModule,
    EnrollmentsModule,
    AttendanceModule,
    NotificationsModule,
    // Assessment module (Phase 2)
    QuestionsModule,
    AssessmentsModule,
    AttemptsModule,
    StudentEnrollmentsModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
