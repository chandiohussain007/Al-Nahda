import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

function resolveCorsOrigins(): boolean | string[] {
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // With no explicit allow-list (local development) reflect the request origin.
  return configured.length > 0 ? configured : true;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cloudflare + Render terminate TLS in front of the container. Trust every
  // hop so req.ip comes from the leftmost X-Forwarded-For entry (the real
  // caller) instead of collapsing to one load-balancer IP, which keeps
  // per-user rate limiting meaningful.
  app.set('trust proxy', true);

  // Security headers: CSP, X-Frame-Options, HSTS, referrer policy, etc.
  app.use(helmet());

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Error tracking. Requires SENTRY_DSN. Guarded so local and preview runs
  // work unchanged; nothing is initialized without a DSN.
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV ?? 'development',
      // Low sample rate keeps the free tier affordable.
      tracesSampleRate: 0.1,
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Al Nahda API')
    .setDescription('Backend API for the Al Nahda learning platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Al Nahda API is running on http://localhost:${port}`);
}

void bootstrap();
