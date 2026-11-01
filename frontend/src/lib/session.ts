import type { Session, UserRole } from './types';

const STORAGE_KEY = 'al-nahda.session';
const USER_KEY = 'al-nahda.user';

/** Reads the stored session from localStorage (with SSR safety). */
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

/** Stores session in localStorage and syncs user info. */
export function writeSession(session: Session): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  if (session?.user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }
}

/** Clears stored session and user data. */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(USER_KEY);
}

/** Reads only the stored user object. */
export function readStoredUser(): { id: string; email: string; role: UserRole } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<{ id: string; email: string; role: UserRole }>;
    if (!parsed?.id || !parsed?.email || !parsed?.role) return null;
    return parsed as { id: string; email: string; role: UserRole };
  } catch {
    return null;
  }
}

export function writeStoredUser(user: { id: string; email: string; role: UserRole }): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  clearSession();
}

export const DASHBOARD_PATHS: Record<UserRole, string> = {
  ADMIN: '/dashboard/admin',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
};

export function dashboardPathFor(role: UserRole): string {
  return DASHBOARD_PATHS[role];
}
