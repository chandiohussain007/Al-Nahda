'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardPathFor, readSession } from '@/lib/session';

/** Sends each role to its own dashboard. */
export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    router.replace(session ? dashboardPathFor(session.user.role) : '/login');
  }, [router]);

  return <p className="muted">Loading…</p>;
}
