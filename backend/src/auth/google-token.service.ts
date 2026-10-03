import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

interface GoogleTokenInfo {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: string;
}

const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const PLACEHOLDER_CLIENT_ID = 'your-google-client-id';

/**
 * Verifies Google Identity Services ID tokens. The token received from the
 * frontend is exchanged with Google's `tokeninfo` endpoint, which validates the
 * signature, expiry and audience for us. This keeps the MVP dependency-free and
 * free-tier friendly; swapping in `google-auth-library` later only requires
 * changing this single service.
 */
@Injectable()
export class GoogleTokenService {
  private readonly logger = new Logger(GoogleTokenService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyIdToken(idToken: string): Promise<GoogleProfile> {
    let payload: GoogleTokenInfo;

    try {
      const response = await fetch(
        `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Google rejected the provided ID token');
      }

      payload = (await response.json()) as GoogleTokenInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.warn(`Google token verification failed: ${String(error)}`);
      throw new UnauthorizedException('Unable to verify Google ID token');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Google ID token is missing required claims');
    }

    if (!payload.iss || !VALID_ISSUERS.includes(payload.iss)) {
      throw new UnauthorizedException('Google ID token has an invalid issuer');
    }

    if (payload.email_verified === false || payload.email_verified === 'false') {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (clientId && clientId !== PLACEHOLDER_CLIENT_ID && payload.aud !== clientId) {
      throw new UnauthorizedException('Google ID token audience mismatch');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
