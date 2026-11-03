'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import ErrorCard from '@/components/feedback/ErrorCard';
import Button from '@/components/ui/Button';
import { apiErrorMessage, loginWithGoogle, registerStudent } from '@/lib/api';
import { dashboardPathFor, readSession, writeSession } from '@/lib/session';
import { useAuth } from '@/context/AuthContext';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_ID_CONFIGURED = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith('your-google-client-id'),
);

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session) router.replace(dashboardPathFor(session.user.role));
  }, [router]);

  const handleCredential = useCallback(
    async (idToken: string) => {
      setBusy(true);
      setError(null);
      try {
        const session = await loginWithGoogle(idToken);
        setSession(session.accessToken, session.user);
      writeSession(session);
        router.replace(dashboardPathFor(session.user.role));
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      const session = await registerStudent({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      setSession(session.accessToken, session.user);
      writeSession(session);
      router.replace(dashboardPathFor(session.user.role));
    } catch (e) {
      setError(apiErrorMessage(e, 'Registration failed'));
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep px-4 py-10">
      <IslamicPattern opacity={0.12} />
      <section className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-surface p-8 shadow-2xl dark:bg-primary">
        <header className="mb-6 text-center">
          <Link href="/" className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-gold hover:opacity-90">
            Al Nahda
          </Link>
          <h1 className="mt-2 text-xl font-bold text-charcoal dark:text-ivory">
            Create an Account
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Join Al Nahda as a student and start your learning journey.
          </p>
        </header>

        {error && <ErrorCard message={error} className="mb-4" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-ivory">
              Full name
            </label>
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 w-full rounded-md border border-sandstone bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-gold/30 dark:bg-deep dark:text-ivory"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-ivory">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-sandstone bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-gold/30 dark:bg-deep dark:text-ivory"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal dark:text-ivory">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="mt-1 w-full rounded-md border border-sandstone bg-surface px-3 py-2 text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 dark:border-gold/30 dark:bg-deep dark:text-ivory"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={busy || !form.fullName || !form.email || !form.password}
            className="w-full mt-2"
          >
            {busy ? 'Creating account…' : 'Register with Email'}
          </Button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sandstone dark:border-gold/20" />
          </div>
          <span className="relative bg-surface px-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-primary dark:text-gold-light/70">
            Or sign up with
          </span>
        </div>

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
          Already registered?{' '}
          <Link href="/login" className="font-semibold text-teal hover:underline dark:text-gold">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
