import type { Session, UserRole } from './types';

const STORAGE_KEY = 'al-nahda.session';

/** Reads the stored session. Safe to call during SSR (returns null). */
export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed?.accessToken || !parsed?.user?.id || !parsed?.user?.role) return null;

    return parsed as Session;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export const DASHBOARD_PATHS: Record<UserRole, string> = {
  ADMIN: '/dashboard/admin',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
};

export function dashboardPathFor(role: UserRole): string {
  return DASHBOARD_PATHS[role];
}
