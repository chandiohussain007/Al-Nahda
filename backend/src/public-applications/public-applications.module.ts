import { Module } from '@nestjs/common';
import { PublicApplicationsController } from './public-applications.controller.js';
import { PublicApplicationsService } from './public-applications.service.js';

@Module({
  controllers: [PublicApplicationsController],
  providers: [PublicApplicationsService],
})
export class PublicApplicationsModule {}
