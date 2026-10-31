import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioController } from './audio.controller.js';
import { AudioService } from './audio.service.js';
import { AudioCleanupService } from './audio-cleanup.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, UsersModule],
  controllers: [AudioController],
  providers: [AudioService, AudioCleanupService],
  exports: [AudioService],
})
export class AudioModule {}
