'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppNavbar from '@/components/layout/AppNavbar';
import { ToastProvider } from '@/components/feedback/Toast';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import { clearSession, dashboardPathFor, readSession } from '@/lib/session';
import type { Session } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
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
        <SkeletonLoader rows={4} height="h-24" />
      </main>
    );
  }

  return (
    <ToastProvider>
      <AppNavbar
        email={session.user.email}
        role={session.user.role}
        home={dashboardPathFor(session.user.role)}
        pathname={pathname}
        onSignOut={signOut}
      />
      <main className="container">{children}</main>
    </ToastProvider>
  );
}
