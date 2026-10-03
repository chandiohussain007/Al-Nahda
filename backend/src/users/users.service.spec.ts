import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from './users.service.js';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

async function buildService(adminEmails: string): Promise<UsersService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: PrismaService, useValue: prismaMock },
      { provide: ConfigService, useValue: { get: vi.fn().mockReturnValue(adminEmails) } },
    ],
  }).compile();

  return moduleRef.get(UsersService);
}

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 'u1' });
  });

  it('creates a new STUDENT by default', async () => {
    const service = await buildService('');

    await service.upsertFromGoogle({ email: 'student@example.com', googleId: 'g1' });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'student@example.com', googleId: 'g1', role: UserRole.STUDENT },
    });
  });

  it('grants ADMIN to emails listed in ADMIN_EMAILS (case-insensitive)', async () => {
    const service = await buildService('admin@alnahda.com, second@alnahda.com');

    await service.upsertFromGoogle({ email: 'Admin@AlNahda.com', googleId: 'g1' });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'Admin@AlNahda.com', googleId: 'g1', role: UserRole.ADMIN },
    });
  });

  it('never lets a client self-assign ADMIN', async () => {
    const service = await buildService('');

    await service.upsertFromGoogle({
      email: 'attacker@example.com',
      googleId: 'g1',
      role: UserRole.ADMIN,
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'attacker@example.com', googleId: 'g1', role: UserRole.STUDENT },
    });
  });

  it('preserves an existing role on later logins', async () => {
    const service = await buildService('');
    prismaMock.user.findFirst.mockResolvedValue({ id: 'u1', role: UserRole.TEACHER });
    prismaMock.user.update.mockResolvedValue({ id: 'u1', role: UserRole.TEACHER });

    await service.upsertFromGoogle({
      email: 'teacher@example.com',
      googleId: 'g1',
      role: UserRole.STUDENT,
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { email: 'teacher@example.com', googleId: 'g1', role: UserRole.TEACHER },
    });
  });
});
