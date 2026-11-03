'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import ErrorCard from '@/components/feedback/ErrorCard';
import Button from '@/components/ui/Button';
import { apiErrorMessage, fetchHealth, loginWithCredentials, loginWithGoogle } from '@/lib/api';
import { dashboardPathFor, writeSession } from '@/lib/session';
import { useAuth } from '@/context/AuthContext';

type HealthState = 'checking' | 'up' | 'down';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_ID_CONFIGURED = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith('your-google-client-id'),
);

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, user, ready, setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthState>('checking');

  // Already signed in? Go straight to the dashboard.
  useEffect(() => {
    if (!ready) return;
    if (accessToken && user) {
      router.replace(dashboardPathFor(user.role));
    }
  }, [ready, accessToken, user, router]);

  // Probe the API before sign-in and show only its status.
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
        const result = await loginWithGoogle(idToken);
        setSession(result.accessToken, result.user);
        writeSession(result);
        router.replace(dashboardPathFor(result.user.role));
      } catch (e) {
        setError(apiErrorMessage(e, 'Sign-in failed'));
        setBusy(false);
      }
    },
    [router, setSession],
  );

  const handleGoogleError = useCallback((googleError: Error) => {
    setError(googleError.message);
  }, []);

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await loginWithCredentials({ email, password });
      setSession(result.accessToken, result.user);
      writeSession(result);
      router.replace(dashboardPathFor(result.user.role));
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign-in failed'));
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep px-4 py-10">
      <IslamicPattern opacity={0.12} />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl"
      />

      <section className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-surface p-8 shadow-2xl dark:bg-primary">
        <header className="mb-6 text-center">
          <Link href="/" className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-gold hover:opacity-90">
            Al Nahda
          </Link>
          <h1 className="mt-2 text-xl font-bold text-charcoal dark:text-ivory">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Sign in with the Google account registered for your Al Nahda portal, or use your email and password.
          </p>
        </header>

        {error && <ErrorCard message={error} className="mb-4" />}

        {/* Standard Email & Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-ivory">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-sandstone bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-gold/30 dark:bg-deep dark:text-ivory"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-ivory">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-sandstone bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-gold/30 dark:bg-deep dark:text-ivory"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={busy || !email || !password}
            className="w-full mt-2"
          >
            {busy ? 'Signing in…' : 'Sign in with Password'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sandstone dark:border-gold/20" />
          </div>
          <span className="relative bg-surface px-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-primary dark:text-gold-light/70">
            Or continue with
          </span>
        </div>

        {/* Google OAuth Option */}
        {CLIENT_ID_CONFIGURED ? (
          <div
            aria-busy={busy}
            className="flex justify-center rounded-lg border border-sandstone bg-white/70 py-2.5 dark:border-gold/25 dark:bg-deep/60"
          >
            <GoogleSignInButton onCredential={handleCredential} onError={handleGoogleError} />
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500">Google sign-in is not configured.</p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-gold-light/80">
          New to Al Nahda?{' '}
          <Link href="/register" className="font-semibold text-teal hover:underline dark:text-gold">
            Create an account
          </Link>
        </p>

        <footer className="mt-5 flex items-center justify-center">
          <span
            role="status"
            aria-label={`Backend status: ${health}`}
            title={`Backend status: ${health}`}
            className="inline-flex items-center"
          >
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-full ${
                health === 'checking'
                  ? 'animate-pulse bg-amber-400'
                  : health === 'up'
                    ? 'bg-emerald-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="sr-only">
              {health === 'checking'
                ? 'Checking backend connection'
                : health === 'up'
                  ? 'Backend reachable'
                  : 'Backend unreachable'}
            </span>
          </span>
        </footer>
      </section>
    </main>
  );
}