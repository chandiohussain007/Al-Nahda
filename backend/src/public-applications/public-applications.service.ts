import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StudentRegistrationDto, TeacherApplicationDto } from './public-applications.dto.js';

@Injectable()
export class PublicApplicationsService {
  private readonly logger = new Logger(PublicApplicationsService.name);

  constructor(private readonly configService: ConfigService) {}

  async submitStudentRegistration(dto: StudentRegistrationDto): Promise<void> {
    const fields = [
      ['Name', dto.fullName],
      ['Email', dto.email],
      ['Preferred course', dto.preferredCourse],
    ] as const;

    await this.send('Student registration request', fields, dto.email);
  }

  async submitTeacherApplication(dto: TeacherApplicationDto): Promise<void> {
    const fields = [
      ['Name', dto.fullName],
      ['Email', dto.email],
      ['Contact number', dto.phoneNumber],
      ['Subject(s) to teach', dto.subject],
      ['Experience', dto.experience],
    ] as const;

    await this.send('Teacher application', fields, dto.email);
  }

  private async send(
    subject: string,
    fields: ReadonlyArray<readonly [string, string]>,
    replyTo: string,
  ): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const from = this.configService.get<string>('RESEND_FROM_EMAIL');
    if (!apiKey || !adminEmail || !from) {
      throw new ServiceUnavailableException(
        'Application email is not configured. Please contact Al Nahda directly.',
      );
    }

    const html = fields
      .map(
        ([label, value]) =>
          `<p><strong>${this.escapeHtml(label)}:</strong><br>${this.escapeHtml(value)}</p>`,
      )
      .join('');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [adminEmail],
        reply_to: replyTo,
        subject: `Al Nahda: ${subject}`,
        html: `<h2>${this.escapeHtml(subject)}</h2>${html}`,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Resend rejected an application email with status ${response.status}`);
      throw new ServiceUnavailableException(
        'We could not send your application right now. Please try again later.',
      );
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const replacements: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return replacements[character];
    });
  }
}
