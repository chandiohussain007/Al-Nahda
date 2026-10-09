'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import ErrorCard from '@/components/feedback/ErrorCard';
import Button from '@/components/ui/Button';
import { apiErrorMessage, loginWithGoogle, submitStudentRegistration } from '@/lib/api';
import { dashboardPathFor, readSession, writeSession } from '@/lib/session';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const CLIENT_ID_CONFIGURED = Boolean(
  GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.endsWith('your-google-client-id'),
);

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', preferredCourse: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitStudentRegistration(form);
      setSuccess(true);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not send your registration request'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-deep px-4 py-10">
      <IslamicPattern opacity={0.12} />
      <section className="relative w-full max-w-xl rounded-2xl border border-gold/30 bg-surface p-8 shadow-2xl dark:bg-primary">
        <header className="mb-6 text-center">
          <Link href="/" className="font-serif text-3xl font-bold tracking-wide text-primary dark:text-gold">
            Al Nahda
          </Link>
          <h1 className="mt-4 font-serif text-2xl font-bold text-primary dark:text-ivory">
            Student registration
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/80">
            Send us your course interest, then use Google to create or access your portal account.
          </p>
        </header>

        {error && <ErrorCard message={error} className="mb-4" />}
        {success ? (
          <div role="status" className="rounded-lg border border-teal/30 bg-teal/5 p-4 text-center">
            <h2 className="font-semibold text-primary dark:text-gold">Registration request sent</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/80">
              The Al Nahda team has received your course interest. To open the portal, continue with
              Google below using the email address you want associated with your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-charcoal dark:text-ivory">
              Full name
              <input
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              />
            </label>
            <label className="block text-sm font-medium text-charcoal dark:text-ivory">
              Email address
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              />
            </label>
            <label className="block text-sm font-medium text-charcoal dark:text-ivory">
              Course of interest
              <select
                required
                value={form.preferredCourse}
                onChange={(event) => setForm({ ...form, preferredCourse: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              >
                <option value="" disabled>Select a course</option>
                <option>Quran Recitation &amp; Tajweed</option>
                <option>Classical Arabic</option>
              </select>
            </label>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Sending request…' : 'Send registration request'}
            </Button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-sandstone dark:bg-gold/20" />
          Portal access
          <span className="h-px flex-1 bg-sandstone dark:bg-gold/20" />
        </div>
        <p className="mb-3 text-center text-sm text-slate-600 dark:text-gold-light/80">
          Already have an account? Sign in with Google. Your role is assigned automatically.
        </p>
        {CLIENT_ID_CONFIGURED ? (
          <div className="flex justify-center rounded-lg border border-sandstone bg-white/70 py-3 dark:border-gold/25 dark:bg-deep/60">
            <GoogleSignInButton onCredential={handleCredential} onError={handleGoogleError} />
          </div>
        ) : (
          <ErrorCard
            title="Google Sign-In is not configured"
            message="Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in the frontend environment to enable portal access."
          />
        )}
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-gold-light/80">
          Want to teach?{' '}
          <Link href="/careers" className="font-semibold text-teal hover:underline dark:text-gold">
            Join our team
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-slate-600 dark:text-gold-light/80">
          <Link href="/" className="hover:underline">Back to Al Nahda</Link>
        </p>
      </section>
    </main>
  );
}
