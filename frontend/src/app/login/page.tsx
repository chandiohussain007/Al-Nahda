'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import ErrorCard from '@/components/feedback/ErrorCard';
import Badge from '@/components/ui/Badge';
import { API_URL, apiErrorMessage, fetchHealth, loginWithGoogle } from '@/lib/api';
import { dashboardPathFor, readSession, writeSession } from '@/lib/session';

type HealthState = 'checking' | 'up' | 'down';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_ID_CONFIGURED = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith('your-google-client-id'),
);

export default function LoginPage() {
  const router = useRouter();
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
        const session = await loginWithGoogle(idToken);
        writeSession(session);
        router.replace(dashboardPathFor(session.user.role));
      } catch (e) {
        setError(apiErrorMessage(e, 'Sign-in failed'));
        setBusy(false);
      }
    },
    [router],
  );
  const handleGoogleError = useCallback((googleError: Error) => {
    setError(googleError.message);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep px-4 py-10">
      {/* Decorative brand background */}
      <IslamicPattern opacity={0.12} />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-surface p-8 shadow-2xl dark:bg-primary">
        <header className="mb-6 text-center">
          <h1 className="m-0 font-serif text-3xl font-bold tracking-wide text-primary dark:text-gold">
            Al Nahda
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Sign in with the Google account registered for your Al Nahda portal.
          </p>
        </header>

        {error && <ErrorCard message={error} className="mb-4" />}

        {CLIENT_ID_CONFIGURED ? (
          <div
            aria-busy={busy}
            className="flex justify-center rounded-lg border border-sandstone bg-white/70 py-3 dark:border-gold/25 dark:bg-deep/60"
          >
            <GoogleSignInButton onCredential={handleCredential} onError={handleGoogleError} />
          </div>
        ) : (
          <ErrorCard
            title="Configuration needed"
            message="NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Copy .env.example to .env.local and fill it in."
          />
        )}

        {busy && (
          <p role="status" className="mt-3 text-center text-sm text-slate-500 dark:text-gold-light/70">
            Signing you in…
          </p>
        )}

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-gold-light/80">
          New to Al Nahda?{' '}
          <Link href="/register" className="font-semibold text-teal hover:underline dark:text-gold">
            Register here
          </Link>
        </p>

        <footer className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-gold-light/70">
          <code className="max-w-[60%] truncate">API: {API_URL || '(not set)'}</code>
          {health === 'checking' && <span>checking…</span>}
          {health === 'up' && <Badge tone="success">reachable</Badge>}
          {health === 'down' && <Badge tone="danger">unreachable</Badge>}
        </footer>
      </section>
    </main>
  );
}
