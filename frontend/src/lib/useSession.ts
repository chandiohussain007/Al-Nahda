'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from './types';

/**
 * Guards a page by role. Redirects to /login when no session exists, or to
 * /dashboard when the role does not match. Returns `{ session, ready }` for
 * backwards-compatibility with existing page components.
 *
 * The session now comes from AuthContext (in-memory access token) rather than
 * localStorage. `ready` is false until the initial silent-refresh resolves.
 */
export function useSession(requiredRole?: UserRole) {
  const router = useRouter();
  const { accessToken, user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return; // still loading

    if (!accessToken || !user) {
      router.replace('/login');
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      router.replace('/dashboard');
    }
  }, [ready, accessToken, user, requiredRole, router]);

  // Return a shape compatible with the old { session, ready } contract so
  // pages don't all need to be updated at once.
  const session =
    accessToken && user
      ? { accessToken, user }
      : null;

  return { session, ready };
}
