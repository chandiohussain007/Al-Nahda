import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleTokenService } from './google-token.service.js';
import { RefreshTokenService } from './refresh-token.service.js';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PrismaModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'dev-secret-key',
        signOptions: {
          // Default expiry — overridden per token type in AuthService
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleTokenService, RefreshTokenService],
  exports: [AuthService, GoogleTokenService, RefreshTokenService],
})
export class AuthModule {}
