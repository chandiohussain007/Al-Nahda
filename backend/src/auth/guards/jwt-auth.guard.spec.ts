import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UsersService } from '../../users/users.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const jwtService = {
  verifyAsync: vi.fn(),
};

const usersService = {
  findById: vi.fn(),
};

function requestContext() {
  const request = { headers: { authorization: 'Bearer valid-token' } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'user@example.com',
      role: 'STUDENT',
    });
    usersService.findById.mockResolvedValue({ id: 'user-1', isActive: true });
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();
    guard = moduleRef.get(JwtAuthGuard);
  });

  it('allows active accounts with valid tokens', async () => {
    const { context, request } = requestContext();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toHaveProperty('user.sub', 'user-1');
  });

  it('rejects tokens belonging to deactivated accounts so clients clear the session', async () => {
    usersService.findById.mockResolvedValue({ id: 'user-1', isActive: false });
    const { context } = requestContext();

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: 401,
      message: 'This account has been deactivated',
    });
  });

  it('rejects tokens for missing accounts', async () => {
    usersService.findById.mockResolvedValue(null);
    const { context } = requestContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not query the user when the token is invalid', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const { context } = requestContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findById).not.toHaveBeenCalled();
  });
});
