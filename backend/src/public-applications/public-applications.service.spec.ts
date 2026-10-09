import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PublicApplicationsService } from './public-applications.service.js';

const configValues: Record<string, string> = {
  RESEND_API_KEY: 'test-api-key',
  ADMIN_EMAIL: 'admin@example.com',
  RESEND_FROM_EMAIL: 'Al Nahda <applications@example.com>',
};

describe('PublicApplicationsService', () => {
  let service: PublicApplicationsService;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const moduleRef = await Test.createTestingModule({
      providers: [
        PublicApplicationsService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => configValues[key]) },
        },
      ],
    }).compile();

    service = moduleRef.get(PublicApplicationsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emails a teacher application to the admin and uses the applicant as reply-to', async () => {
    await service.submitTeacherApplication({
      fullName: 'Omar Hassan',
      email: 'omar@example.com',
      phoneNumber: '+971500000000',
      subject: 'Arabic',
      experience: 'Five years teaching adult learners.',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-api-key' }),
      }),
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toEqual(['admin@example.com']);
    expect(payload.reply_to).toBe('omar@example.com');
    expect(payload.html).toContain('Five years teaching adult learners.');
  });

  it('escapes application values before inserting them into the email HTML', async () => {
    await service.submitStudentRegistration({
      fullName: '<script>alert(1)</script>',
      email: 'student@example.com',
      preferredCourse: 'Arabic & Quran',
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.html).not.toContain('<script>');
    expect(payload.html).toContain('&lt;script&gt;');
    expect(payload.html).toContain('Arabic &amp; Quran');
  });

  it('surfaces provider delivery failures', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422 });

    await expect(
      service.submitStudentRegistration({
        fullName: 'Aisha Rahman',
        email: 'aisha@example.com',
        preferredCourse: 'Learn Quran',
      }),
    ).rejects.toThrow('We could not send your application right now.');
  });
});
