import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { UsersService } from '../users/users.service.js';
import { GoogleLoginDto } from './auth.dto.js';
import { GoogleTokenService } from './google-token.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: { id: string; email: string; role: UserRole };
}

@Injectable()
export class AuthService {
  private readonly accessExpiry: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly usersService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    this.accessExpiry =
      this.configService.get<string>('JWT_ACCESS_EXPIRY') ?? '15m';
  }

  /** Issues a short-lived access token (kept in memory by the frontend). */
  issueAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.accessExpiry as any,
    });
  }

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResult> {
    const profile = await this.googleTokenService.verifyIdToken(dto.idToken);

    const user = await this.usersService.upsertFromGoogle({
      email: profile.email,
      googleId: profile.googleId,
    });

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.issueAccessToken(payload);
    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id);
    const csrfToken = randomUUID();

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async refreshSession(rawToken: string | undefined): Promise<AuthResult> {
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { userId, family } = await this.refreshTokenService.rotateRefreshToken(rawToken);

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account not found');
    if (!user.isActive) throw new UnauthorizedException('Account deactivated');

    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.issueAccessToken(payload);
    // Rotate: issue new refresh token in the same family
    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id, family);
    const csrfToken = randomUUID();

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenService.revokeAllForUser(userId);
  }
}
