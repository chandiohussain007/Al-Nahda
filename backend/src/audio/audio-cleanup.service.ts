import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AudioService } from './audio.service.js';

@Injectable()
export class AudioCleanupService {
  private readonly logger = new Logger(AudioCleanupService.name);

  constructor(private readonly audioService: AudioService) {}

  /**
   * Automatically purge student recordings older than 30 days every day at 3:00 AM.
   * Keeps Cloudflare R2 usage well under free tier 10 GB limits forever!
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetentionCleanup() {
    this.logger.log('Starting automated 30-day audio retention cleanup...');
    try {
      const result = await this.audioService.cleanupOldAudio();
      this.logger.log(`Retention cleanup finished: deleted ${result.deleted} expired recordings.`);
    } catch (err: unknown) {
      this.logger.error('Failed to run audio retention cleanup cron', err);
    }
  }
}
