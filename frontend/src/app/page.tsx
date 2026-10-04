'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardPathFor, readSession } from '@/lib/session';

/** Landing page: send the visitor to their dashboard or to the login screen. */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    router.replace(session ? dashboardPathFor(session.user.role) : '/login');
  }, [router]);

  return (
    <main className="container">
      <p className="muted">Loading…</p>
    </main>
  );
}
