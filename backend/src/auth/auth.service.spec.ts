import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { GoogleTokenService } from './google-token.service.js';

const jwtServiceMock = { sign: vi.fn() };
const googleTokenServiceMock = { verifyIdToken: vi.fn() };
const usersServiceMock = { upsertFromGoogle: vi.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    jwtServiceMock.sign.mockReturnValue('signed-token');

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: GoogleTokenService, useValue: googleTokenServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('verifies the Google token, upserts the user and signs a JWT', async () => {
    googleTokenServiceMock.verifyIdToken.mockResolvedValue({
      googleId: 'google-1',
      email: 'student@example.com',
    });
    usersServiceMock.upsertFromGoogle.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });

    const idToken = 'a'.repeat(30);
    const result = await service.googleLogin({ idToken });

    expect(googleTokenServiceMock.verifyIdToken).toHaveBeenCalledWith(idToken);
    expect(usersServiceMock.upsertFromGoogle).toHaveBeenCalledWith({
      email: 'student@example.com',
      googleId: 'google-1',
      role: undefined,
    });
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'student@example.com',
      role: UserRole.STUDENT,
    });
  });
});
