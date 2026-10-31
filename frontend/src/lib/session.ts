import type { UserRole } from './types';

const USER_KEY = 'al-nahda.user';

/**
 * Persists only the non-sensitive user profile (id, email, role) to
 * localStorage. The access token is NEVER stored on disk — it lives in the
 * AuthContext React state only, so it is wiped on tab close / refresh.
 *
 * On next page load, `useAuth` calls POST /api/auth/refresh automatically;
 * the httpOnly refresh-token cookie is sent by the browser, and a new
 * access token is returned.
 */
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
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(USER_KEY);
}

export const DASHBOARD_PATHS: Record<UserRole, string> = {
  ADMIN: '/dashboard/admin',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
};

export function dashboardPathFor(role: UserRole): string {
  return DASHBOARD_PATHS[role];
}

// ─── Legacy shim — kept so existing callers still compile ───────────────────
// Components that previously called readSession() / writeSession() / clearSession()
// continue to work via these aliases. Migrate them to the AuthContext hook
// (`useAuth`) progressively.

export type Session = { accessToken: string; user: { id: string; email: string; role: UserRole } };

/** @deprecated Use useAuth() from AuthContext instead. */
export function readSession(): Session | null {
  // During the migration period, reading the session is not possible without
  // the in-memory access token. Return null to trigger the refresh flow.
  return null;
}

/** @deprecated Tokens are no longer stored in localStorage. Use AuthContext. */
export function writeSession(_session: Session): void {
  if (_session.user) writeStoredUser(_session.user);
}

/** @deprecated Use logout() from AuthContext instead. */
export function clearSession(): void {
  clearStoredUser();
}
