import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Controller('api')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Liveness probe: the API process is running' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'Al Nahda API',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe: the API can reach PostgreSQL' })
  async readinessCheck() {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        database: 'unreachable',
        timestamp,
      });
    }

    return {
      status: 'ready',
      database: 'connected',
      timestamp,
    };
  }
}
