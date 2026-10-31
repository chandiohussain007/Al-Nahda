import { SetMetadata } from '@nestjs/common';
import { SKIP_CSRF_KEY } from '../guards/csrf.guard.js';

/**
 * Opt a controller or handler out of CSRF validation.
 * Use sparingly — only on truly public, read-only, or external-callback
 * endpoints (e.g. Google OAuth callback, health check).
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
