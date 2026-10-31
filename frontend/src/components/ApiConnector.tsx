'use client';

/**
 * ApiConnector — renders nothing visible.
 *
 * Its sole job is to sit inside <AuthProvider> and call registerTokenAccessor()
 * once on mount, wiring the Axios interceptors to the in-memory token stored
 * in AuthContext. This avoids a circular import between api.ts and AuthContext.
 */
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { registerTokenAccessor, API_URL } from '@/lib/api';

export function ApiConnector() {
  const { getAccessToken } = useAuth();

  useEffect(() => {
    async function refresher(): Promise<string | null> {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string };
        return data.accessToken;
      } catch {
        return null;
      }
    }

    registerTokenAccessor(getAccessToken, refresher);
  }, [getAccessToken]);

  return null;
}
