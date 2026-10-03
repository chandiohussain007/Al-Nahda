import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { GoogleLoginDto } from './auth.dto.js';
import { GoogleTokenService } from './google-token.service.js';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly googleTokenService: GoogleTokenService,
    private readonly usersService: UsersService,
  ) {}

  issueToken(payload: TokenPayload) {
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const profile = await this.googleTokenService.verifyIdToken(dto.idToken);

    const user = await this.usersService.upsertFromGoogle({
      email: profile.email,
      googleId: profile.googleId,
      role: dto.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...this.issueToken({
        sub: user.id,
        email: user.email,
        role: user.role,
      }),
    };
  }
}
