const REQUIRED_IN_PRODUCTION = ['DATABASE_URL', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
const INSECURE_JWT_SECRETS = new Set(['', 'dev-secret-key', 'replace-with-your-secret']);

/**
 * Fails fast on unsafe production configuration. In non-production
 * environments the defaults are allowed so the API can boot for local work and
 * unit tests without a full environment.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  if (config.NODE_ENV !== 'production') {
    return config;
  }

  const missing = REQUIRED_IN_PRODUCTION.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (INSECURE_JWT_SECRETS.has(jwtSecret) || jwtSecret.length < 16) {
    throw new Error('JWT_SECRET must be a strong, unique value in production');
  }

  const port = Number(config.PORT ?? 3000);
  if (Number.isNaN(port)) {
    throw new Error(`PORT must be a number, received "${String(config.PORT)}"`);
  }

  return config;
}
