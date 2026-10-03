import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GoogleTokenService } from './google-token.service.js';

describe('GoogleTokenService', () => {
  let service: GoogleTokenService;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);

    const moduleRef = await Test.createTestingModule({
      providers: [
        GoogleTokenService,
        { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue('client-123') } },
      ],
    }).compile();

    service = moduleRef.get(GoogleTokenService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the Google profile for a valid token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-1',
        email: 'student@example.com',
        email_verified: 'true',
        iss: 'https://accounts.google.com',
        aud: 'client-123',
        name: 'Aisha',
      }),
    });

    await expect(service.verifyIdToken('token')).resolves.toEqual({
      googleId: 'google-1',
      email: 'student@example.com',
      name: 'Aisha',
      picture: undefined,
    });
  });

  it('rejects a token issued for a different audience', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'google-1',
        email: 'student@example.com',
        email_verified: 'true',
        iss: 'https://accounts.google.com',
        aud: 'someone-else',
      }),
    });

    await expect(service.verifyIdToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when Google returns an error status', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    await expect(service.verifyIdToken('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
