'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardPathFor } from '@/lib/session';
import { useAuth } from '@/context/AuthContext';

/** Sends each role to its own dashboard. */
export default function DashboardIndex() {
  const router = useRouter();
  const { accessToken, user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (accessToken && user) {
      router.replace(dashboardPathFor(user.role));
    } else {
      router.replace('/login');
    }
  }, [ready, accessToken, user, router]);

  return <p className="muted">Loading…</p>;
}
