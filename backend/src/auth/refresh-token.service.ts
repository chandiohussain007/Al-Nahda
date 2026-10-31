import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export interface RefreshTokenPayload {
  sub: string;
  family: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly refreshSecret: string;
  private readonly refreshExpiry: string;
  private readonly BCRYPT_ROUNDS = 10;
  private readonly EXPIRY_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret-key-change-in-prod';
    this.refreshExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRY') ?? '7d';
  }

  /** Creates a new refresh token JWT, hashes it, and stores it in the DB. */
  async createRefreshToken(userId: string, family?: string): Promise<string> {
    const tokenFamily = family ?? randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.EXPIRY_DAYS);

    const token = this.jwtService.sign(
      { sub: userId, family: tokenFamily } satisfies RefreshTokenPayload,
      { secret: this.refreshSecret, expiresIn: this.refreshExpiry as any },
    );

    const tokenHash = await bcrypt.hash(token, this.BCRYPT_ROUNDS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family: tokenFamily,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Validates a refresh token cookie.
   * - Verifies the JWT signature.
   * - Looks up a matching hash in the DB.
   * - If a hash in the same family was already consumed, revokes the whole
   *   family (token reuse / theft detected) and throws.
   * - On success: deletes the old row and returns the userId + family
   *   so the caller can issue a fresh pair.
   */
  async rotateRefreshToken(
    token: string,
  ): Promise<{ userId: string; family: string }> {
    // 1. Verify signature & expiry
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, family } = payload;

    // 2. Find a stored token in this family
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, family, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      // Token family does not exist — could be reuse of already-rotated token
      // (theft signal). Revoke the entire family.
      await this.revokeFamily(family);
      throw new UnauthorizedException('Refresh token reuse detected. Please log in again.');
    }

    // 3. Verify the hash matches
    const isValid = await bcrypt.compare(token, stored.tokenHash);
    if (!isValid) {
      await this.revokeFamily(family);
      throw new UnauthorizedException('Refresh token invalid. Please log in again.');
    }

    // 4. Consume this token (delete it — it will be replaced by a new one)
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return { userId, family };
  }

  /** Revokes all tokens belonging to a user (logout from all devices). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /** Revokes all tokens in a specific family (theft containment). */
  private async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { family } });
  }
}
