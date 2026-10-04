'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { readSession } from './session';
import type { Session, UserRole } from './types';

/**
 * Reads the stored session on the client and bounces the visitor to /login
 * when there is none. `ready` is false until the first read completes, so
 * callers can avoid flashing the wrong screen during hydration.
 */
export function useSession(requiredRole?: UserRole) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readSession();

    if (!stored) {
      router.replace('/login');
      return;
    }

    if (requiredRole && stored.user.role !== requiredRole) {
      router.replace('/dashboard');
      return;
    }

    setSession(stored);
    setReady(true);
  }, [router, requiredRole]);

  return { session, ready };
}
