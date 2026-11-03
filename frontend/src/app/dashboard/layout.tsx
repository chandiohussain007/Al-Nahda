'use client';

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

  // While checking refresh token or if not authenticated yet:
  if (!ready) {
    return (
      <main className="container">
        <SkeletonLoader rows={4} height="h-24" />
      </main>
    );
  }

  // Not signed in
  if (!accessToken || !user) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
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
