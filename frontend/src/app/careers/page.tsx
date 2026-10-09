'use client';

import { useState } from 'react';
import Link from 'next/link';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import ErrorCard from '@/components/feedback/ErrorCard';
import Button from '@/components/ui/Button';
import { apiErrorMessage, submitTeacherApplication } from '@/lib/api';

export default function CareersPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    subject: '',
    experience: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitTeacherApplication(form);
      setSuccess(true);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not send your application'));
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
            Join our teaching team
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/80">
            Tell us about your teaching experience and the subject you would like to teach. Your
            application will be emailed to our team.
          </p>
        </header>

        {error && <ErrorCard message={error} className="mb-4" />}
        {success ? (
          <div role="status" className="rounded-lg border border-teal/30 bg-teal/5 p-4 text-center">
            <h2 className="font-semibold text-primary dark:text-gold">Application sent</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/80">
              Thank you for your interest. The Al Nahda team has received your application and can
              reply directly to the email address you provided.
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
              Contact number
              <input
                required
                type="tel"
                minLength={5}
                maxLength={40}
                autoComplete="tel"
                value={form.phoneNumber}
                onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              />
            </label>
            <label className="block text-sm font-medium text-charcoal dark:text-ivory">
              Subject you would like to teach
              <input
                required
                minLength={2}
                maxLength={200}
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              />
            </label>
            <label className="block text-sm font-medium text-charcoal dark:text-ivory">
              Teaching experience
              <textarea
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                value={form.experience}
                onChange={(event) => setForm({ ...form, experience: event.target.value })}
                className="mt-1 w-full rounded-lg border border-sandstone bg-white px-3 py-2.5 text-charcoal dark:border-gold/30 dark:bg-deep dark:text-ivory"
              />
            </label>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Sending application…' : 'Send application'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-gold-light/80">
          <Link href="/" className="hover:underline">Back to Al Nahda</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:underline">Portal sign in</Link>
        </p>
      </section>
    </main>
  );
}
