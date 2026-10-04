'use client';

import type { ReactNode } from 'react';
import { useSession } from '@/lib/useSession';
import type { UserRole } from '@/lib/types';

/**
 * Route-level RBAC guard. Mirrors the backend's `@Roles(...)` decorators so a
 * student can't open the admin screen (and vice versa) even client-side.
 */
export default function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { ready } = useSession(role);

  if (!ready) return <p className="muted">Loading…</p>;

  return <>{children}</>;
}
