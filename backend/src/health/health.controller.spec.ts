import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

const prismaMock = { $queryRaw: vi.fn() };

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('reports liveness', () => {
    expect(controller.healthCheck()).toMatchObject({ status: 'ok' });
  });

  it('reports readiness when the database responds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.readinessCheck()).resolves.toMatchObject({
      status: 'ready',
      database: 'connected',
    });
  });

  it('fails readiness when the database is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.readinessCheck()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
