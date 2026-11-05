import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Returns a 4-digit formatted User ID number (e.g. "0001", "0002") based on
 * the user's chronological creation position among all registered users.
 */
export async function getUserIdNumber(prisma: PrismaService, userId: string): Promise<string> {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!targetUser) {
    return '0000';
  }

  // Count how many users were created before or at the same time as this user
  const count = await prisma.user.count({
    where: {
      createdAt: { lte: targetUser.createdAt },
    },
  });

  return String(count).padStart(4, '0');
}

/**
 * Resolves an array of 4-digit ID strings or UUIDs to User objects (id, userIdNumber, role, email).
 */
export async function findUsersByIdsOrNumbers(
  prisma: PrismaService,
  identifiers: string[],
): Promise<Array<{ id: string; userIdNumber: string; role: string; email: string }>> {
  // Fetch all users ordered by createdAt to reliably map their 4-digit numbers
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, email: true },
  });

  const usersWithNumbers = allUsers.map((u, index) => ({
    ...u,
    userIdNumber: String(index + 1).padStart(4, '0'),
  }));

  const cleanIds = identifiers.map((id) => id.trim()).filter(Boolean);

  return usersWithNumbers.filter(
    (u) => cleanIds.includes(u.userIdNumber) || cleanIds.includes(u.id),
  );
}
