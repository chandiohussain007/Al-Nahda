import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AudioService } from './audio.service.js';
import { ConfirmAudioUploadDto, PresignedUploadDto, ReviewAudioDto } from './audio.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@ApiTags('Audio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('presigned-upload')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Generate presigned Cloudflare R2 upload URL for student recitation' })
  async getPresignedUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PresignedUploadDto,
  ) {
    return this.audioService.getPresignedUploadUrl(user.sub, dto);
  }

  @Post('confirm')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Save audio homework submission record after direct upload to R2' })
  async confirmUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmAudioUploadDto,
  ) {
    return this.audioService.confirmUpload(user.sub, dto);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'List all audio homework submissions for an enrollment' })
  async getEnrollmentAudios(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.audioService.getEnrollmentAudios(enrollmentId, user.sub, user.role);
  }

  @Patch(':id/review')
  @Roles('TEACHER')
  @ApiOperation({ summary: 'Teacher adds voice or written feedback note to student submission' })
  async reviewAudio(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReviewAudioDto,
  ) {
    return this.audioService.reviewAudio(id, user.sub, dto);
  }

  @Post('cleanup')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin manual trigger for 30-day audio retention cleanup' })
  async cleanupAudio() {
    return this.audioService.cleanupOldAudio();
  }
}
