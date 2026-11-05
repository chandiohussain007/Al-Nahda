'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { UserRole } from '../lib/types';
import { clearStoredUser, readStoredUser, writeStoredUser } from '../lib/session';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionUser {
  userIdNumber?: string;
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  /** Short-lived JWT kept in memory only — never written to localStorage/disk. */
  accessToken: string | null;
  user: SessionUser | null;
  /** True after the initial silent-refresh attempt resolves. */
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  /** Called after a successful Google login — stores token in memory. */
  setSession: (token: string, user: SessionUser) => void;
  /** Reads the current in-memory access token (for Axios interceptors). */
  getAccessToken: () => string | null;
  /** Logs out: clears state + calls POST /api/auth/logout. */
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    user: null,
    ready: false,
  });

  // Ref so the Axios interceptor can read the latest token without a stale
  // closure, and without the interceptor needing re-registration on every render.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = state.accessToken;

  const getAccessToken = useCallback(() => tokenRef.current, []);

  const setSession = useCallback((token: string, user: SessionUser) => {
    tokenRef.current = token;
    setState({ accessToken: token, user, ready: true });
    writeStoredUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh token cookie
        headers: {
          Authorization: `Bearer ${tokenRef.current ?? ''}`,
          // Mirror the csrf-token cookie in the header for the CSRF guard
          'X-CSRF-Token': getCsrfCookie(),
        },
      });
    } catch {
      // Best-effort logout — clear state regardless
    }
    tokenRef.current = null;
    setState({ accessToken: null, user: null, ready: true });
    clearStoredUser();
  }, []);

  // ── Silent refresh on mount ──────────────────────────────────────────────
  // On every cold page load (including tab refresh), try to restore the
  // session via the httpOnly refresh token cookie. If the cookie is missing or
  // expired, the user is considered logged out.
  useEffect(() => {
    let cancelled = false;

    async function silentRefresh() {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // sends the httpOnly refreshToken cookie
        });

        if (!res.ok) throw new Error('refresh failed');

        const data = (await res.json()) as { accessToken: string; user: SessionUser };
        if (cancelled) return;

        tokenRef.current = data.accessToken;
        setState({ accessToken: data.accessToken, user: data.user, ready: true });
        writeStoredUser(data.user);
      } catch {
        if (cancelled) return;
        // No valid refresh token — start unauthenticated
        clearStoredUser();
        setState({ accessToken: null, user: null, ready: true });
      }
    }

    void silentRefresh();
    return () => { cancelled = true; };
  }, []);

  const value: AuthContextValue = {
    ...state,
    setSession,
    getAccessToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Default fallback for isolated unit testing & SSR ───────────────────────

const defaultAuthContextValue: AuthContextValue = {
  accessToken: null,
  user: null,
  ready: true,
  setSession: () => {},
  getAccessToken: () => null,
  logout: async () => {},
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? defaultAuthContextValue;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reads the CSRF token from the non-httpOnly csrf-token cookie. */
export function getCsrfCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf-token='));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : '';
}
