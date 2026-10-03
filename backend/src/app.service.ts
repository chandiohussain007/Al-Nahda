import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getAppInfo() {
    return {
      name: 'Al Nahda API',
      version: '1.0.0',
      status: 'running',
      features: [
        'Google OAuth',
        'Student profiles',
        'Teacher profiles',
        'Assessment engine',
        'Enrollment flow',
        'Attendance and notifications',
      ],
    };
  }
}
