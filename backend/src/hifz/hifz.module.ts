import { Module } from '@nestjs/common';
import { HifzController } from './hifz.controller.js';
import { HifzService } from './hifz.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [HifzController],
  providers: [HifzService],
  exports: [HifzService],
})
export class HifzModule {}
