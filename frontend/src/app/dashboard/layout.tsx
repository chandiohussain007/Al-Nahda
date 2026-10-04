'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, dashboardPathFor, readSession } from '@/lib/session';
import type { Session } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      router.replace('/login');
      return;
    }
    setSession(stored);
    setReady(true);
  }, [router]);

  const signOut = () => {
    clearSession();
    router.replace('/login');
  };

  if (!ready || !session) {
    return (
      <main className="container">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const home = dashboardPathFor(session.user.role);
  const onHome = pathname === home;
  const onNotifications = pathname.startsWith('/dashboard/notifications');

  return (
    <>
      <nav className="nav">
        <strong>Al Nahda</strong>
        <Link href={home} className={onHome ? 'active' : undefined}>
          Dashboard
        </Link>
        <Link href="/dashboard/notifications" className={onNotifications ? 'active' : undefined}>
          Notifications
        </Link>
        <span className="spacer" />
        <span className="muted">
          {session.user.email} · <span className="badge">{session.user.role}</span>
        </span>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </nav>
      <main className="container">{children}</main>
    </>
  );
}
