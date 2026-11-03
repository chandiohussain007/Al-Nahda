import { Throttle } from '@nestjs/throttler';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { GoogleLoginDto, LoginDto, RegisterDto } from './auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface.js';
import { SkipCsrf } from '../common/decorators/skip-csrf.decorator.js';

/** Cookie name for the httpOnly refresh token. */
export const REFRESH_COOKIE = 'refreshToken';

/** Cookie name for the CSRF double-submit token (readable by JS). */
export const CSRF_COOKIE = 'csrf-token';

const IS_PROD = process.env.NODE_ENV === 'production';

/** Shared cookie options for the refresh token (httpOnly, Secure in prod). */
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/',
  };
}

/** CSRF cookie is non-httpOnly so the browser JS can read and mirror it. */
export function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Standard email + password registration for students.
   */
  @Post('register')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student with email and password' })
  @ApiResponse({ status: 201, description: 'Student registered and session issued' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.cookie(CSRF_COOKIE, result.csrfToken, csrfCookieOptions());
    return { accessToken: result.accessToken, user: result.user };
  }

  /**
   * Standard email + password login.
   */
  @Post('login')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Authenticated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.cookie(CSRF_COOKIE, result.csrfToken, csrfCookieOptions());
    return { accessToken: result.accessToken, user: result.user };
  }

  /**
   * Exchange a Google ID token for an access token (JSON) + refresh token (httpOnly cookie).
   */
  @Post('google')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a Google ID token and issue an internal JWT' })
  @ApiResponse({ status: 200, description: 'Google identity verified and token issued' })
  @ApiResponse({ status: 401, description: 'The Google ID token is invalid' })
  async googleLogin(
    @Body() dto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(dto);

    // Set the refresh token as a secure httpOnly cookie
    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    // Set the CSRF token as a readable cookie (mirrored by JS in X-CSRF-Token header)
    res.cookie(CSRF_COOKIE, result.csrfToken, csrfCookieOptions());

    // Return only the short-lived access token + user info to the frontend
    return { accessToken: result.accessToken, user: result.user };
  }

  /**
   * Use the httpOnly refresh token cookie to get a new access token.
   * Also rotates the refresh token (issues a new cookie, invalidates the old one).
   */
  @Post('refresh')
  @SkipCsrf()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Silently refresh the access token using the httpOnly cookie' })
  @ApiResponse({ status: 200, description: 'New access token issued' })
  @ApiResponse({ status: 401, description: 'Refresh token missing, expired, or reused' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies as Record<string, string>)?.[REFRESH_COOKIE];
    const result = await this.authService.refreshSession(token);

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.cookie(CSRF_COOKIE, result.csrfToken, csrfCookieOptions());

    return { accessToken: result.accessToken, user: result.user };
  }

  /**
   * Log out: clear the refresh token cookie and revoke all tokens for this user.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Log out and revoke all refresh tokens for this user' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });
  }
}
