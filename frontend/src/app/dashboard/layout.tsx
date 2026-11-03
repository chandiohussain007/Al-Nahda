'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppNavbar from '@/components/layout/AppNavbar';
import { ToastProvider } from '@/components/feedback/Toast';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import { dashboardPathFor } from '@/lib/session';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? '/';
  const { accessToken, user, ready, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  // Redirect to login only inside useEffect to avoid React setState-in-render errors
  useEffect(() => {
    if (ready && (!accessToken || !user)) {
      router.replace('/login');
    }
  }, [ready, accessToken, user, router]);

  // While checking refresh token or if not authenticated yet:
  if (!ready || !accessToken || !user) {
    return (
      <main className="container">
        <SkeletonLoader rows={4} height="h-24" />
      </main>
    );
  }

  return (
    <ToastProvider>
      <AppNavbar
        email={user.email}
        role={user.role}
        home={dashboardPathFor(user.role)}
        pathname={pathname}
        onSignOut={handleSignOut}
      />
      <main className="container">{children}</main>
    </ToastProvider>
  );
}
