import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { EvaluationsModule } from './evaluations/evaluations.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
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
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
