'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { API_URL, apiErrorMessage, fetchHealth, loginWithGoogle } from '@/lib/api';
import { dashboardPathFor, readSession, writeSession } from '@/lib/session';

type HealthState = 'checking' | 'up' | 'down';
type RequestedRole = 'STUDENT' | 'TEACHER';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_ID_CONFIGURED = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith('your-google-client-id'),
);

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<RequestedRole>('STUDENT');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>('checking');

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    const session = readSession();
    if (session) router.replace(dashboardPathFor(session.user.role));
  }, [router]);

  // Probe the API so a bad URL or a dead backend is obvious before signing in.
  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then(() => !cancelled && setHealth('up'))
      .catch(() => !cancelled && setHealth('down'));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        const session = await loginWithGoogle(idToken, role);
        writeSession(session);
        router.replace(dashboardPathFor(session.user.role));
      } catch (e) {
        setError(apiErrorMessage(e, 'Sign-in failed'));
        setBusy(false);
      }
    },
    [role, router],
  );

  return (
    <main className="center">
      <div className="card">
        <h1>Al Nahda</h1>
        <p className="muted">Sign in to continue to the learning platform.</p>

        {error && <div className="error">{error}</div>}

        <fieldset style={{ border: 0, padding: 0, margin: '0 0 16px' }}>
          <legend style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
            I am signing in as
          </legend>
          <div className="row">
            <label className="row" style={{ margin: 0 }}>
              <input
                type="radio"
                name="role"
                value="STUDENT"
                checked={role === 'STUDENT'}
                onChange={() => setRole('STUDENT')}
                disabled={busy}
                style={{ width: 'auto' }}
              />{' '}
              Student
            </label>
            <label className="row" style={{ margin: 0 }}>
              <input
                type="radio"
                name="role"
                value="TEACHER"
                checked={role === 'TEACHER'}
                onChange={() => setRole('TEACHER')}
                disabled={busy}
                style={{ width: 'auto' }}
              />{' '}
              Teacher
            </label>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            Teacher accounts require admin approval before they can teach. Admins are granted
            automatically by email allow-list — no need to select that role.
          </p>
        </fieldset>

        {CLIENT_ID_CONFIGURED ? (
          <GoogleSignInButton onCredential={handleCredential} />
        ) : (
          <div className="error">
            NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code> and fill it in.
          </div>
        )}

        <p className="muted" style={{ marginTop: 16 }}>
          API: <code>{API_URL || '(NEXT_PUBLIC_API_URL not set)'}</code>
          {' · '}
          {health === 'checking' && 'checking…'}
          {health === 'up' && <span className="badge ok">reachable</span>}
          {health === 'down' && <span className="badge err">unreachable</span>}
        </p>
      </div>
    </main>
  );
}
