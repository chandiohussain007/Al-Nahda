import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleLoginDto, LoginDto, RegisterDto } from './auth.dto.js';
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
    private readonly prisma: PrismaService,
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

  private async buildAuthResult(userId: string, email: string, role: UserRole): Promise<AuthResult> {
    const payload: TokenPayload = {
      sub: userId,
      email,
      role,
    };
    const accessToken = this.issueAccessToken(payload);
    const refreshToken = await this.refreshTokenService.createRefreshToken(userId);
    const csrfToken = randomUUID();

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: { id: userId, email, role },
    };
  }

  async googleLogin(dto: GoogleLoginDto): Promise<AuthResult> {
    const profile = await this.googleTokenService.verifyIdToken(dto.idToken);

    const user = await this.usersService.upsertFromGoogle({
      email: profile.email,
      googleId: profile.googleId,
    });

    return this.buildAuthResult(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const isAdmin = this.usersService.isAdminEmail(email);
    const role = isAdmin ? UserRole.ADMIN : UserRole.STUDENT;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        studentProfile: {
          create: {
            fullName: dto.fullName.trim(),
          },
        },
      },
    });

    return this.buildAuthResult(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated. Contact an administrator.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account was registered using Google Sign-In. Please sign in with Google.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user.id, user.email, user.role);
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
