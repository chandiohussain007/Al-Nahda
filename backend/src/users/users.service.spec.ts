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

async function buildService(adminEmails: string, teacherEmails = ''): Promise<UsersService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: PrismaService, useValue: prismaMock },
      {
        provide: ConfigService,
        useValue: {
          get: vi.fn((key: string) => (key === 'ADMIN_EMAILS' ? adminEmails : teacherEmails)),
        },
      },
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

  it('grants TEACHER to emails listed in TEACHER_EMAILS (case-insensitive)', async () => {
    const service = await buildService('', 'teacher@alnahda.com');

    await service.upsertFromGoogle({
      email: 'Teacher@AlNahda.com',
      googleId: 'g1',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'Teacher@AlNahda.com', googleId: 'g1', role: UserRole.TEACHER },
    });
  });

  it('gives ADMIN precedence when an address appears in both allow-lists', async () => {
    const service = await buildService('admin@alnahda.com', 'admin@alnahda.com');

    await service.upsertFromGoogle({ email: 'admin@alnahda.com', googleId: 'g1' });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: 'admin@alnahda.com', googleId: 'g1', role: UserRole.ADMIN },
    });
  });

  it('removes a stored teacher role if the email is not in the teacher allow-list', async () => {
    const service = await buildService('');
    prismaMock.user.findFirst.mockResolvedValue({ id: 'u1', role: UserRole.TEACHER });
    prismaMock.user.update.mockResolvedValue({ id: 'u1', role: UserRole.STUDENT });

    await service.upsertFromGoogle({ email: 'teacher@example.com', googleId: 'g1' });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { email: 'teacher@example.com', googleId: 'g1', role: UserRole.STUDENT },
    });
  });

  it('assigns TEACHER role to an existing user after the email is allow-listed', async () => {
    const service = await buildService('', 'teacher@example.com');
    prismaMock.user.findFirst.mockResolvedValue({ id: 'u1', role: UserRole.STUDENT });
    prismaMock.user.update.mockResolvedValue({ id: 'u1', role: UserRole.TEACHER });

    await service.upsertFromGoogle({ email: 'teacher@example.com', googleId: 'g1' });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { email: 'teacher@example.com', googleId: 'g1', role: UserRole.TEACHER },
    });
  });
});
