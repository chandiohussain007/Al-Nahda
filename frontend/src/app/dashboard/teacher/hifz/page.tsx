'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/useSession';
import { api } from '@/lib/api';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import { PlusCircle, Check, AlertCircle } from 'lucide-react';

export default function TeacherHifzPage() {
  const { session, ready } = useSession('TEACHER');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    sabaqSurah: '',
    sabaqFrom: '',
    sabaqTo: '',
    sabqiSurah: '',
    sabqiFrom: '',
    sabqiTo: '',
    manzilSurah: '',
    manzilFrom: '',
    manzilTo: '',
    teacherNotes: '',
  });

  useEffect(() => {
    if (!ready) return;
    api.get('/api/enrollment')
      .then((res) => {
        setEnrollments(res.data);
        if (res.data.length > 0) setSelectedEnrollmentId(res.data[0].id);
      })
      .catch(() => {});
  }, [ready]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/api/hifz/record', {
        enrollmentId: selectedEnrollmentId,
        sabaqSurah: form.sabaqSurah ? Number(form.sabaqSurah) : undefined,
        sabaqFrom: form.sabaqFrom ? Number(form.sabaqFrom) : undefined,
        sabaqTo: form.sabaqTo ? Number(form.sabaqTo) : undefined,
        sabqiSurah: form.sabqiSurah ? Number(form.sabqiSurah) : undefined,
        sabqiFrom: form.sabqiFrom ? Number(form.sabqiFrom) : undefined,
        sabqiTo: form.sabqiTo ? Number(form.sabqiTo) : undefined,
        manzilSurah: form.manzilSurah ? Number(form.manzilSurah) : undefined,
        manzilFrom: form.manzilFrom ? Number(form.manzilFrom) : undefined,
        manzilTo: form.manzilTo ? Number(form.manzilTo) : undefined,
        teacherNotes: form.teacherNotes || undefined,
      });

      setSuccess(true);
      setForm({
        sabaqSurah: '',
        sabaqFrom: '',
        sabaqTo: '',
        sabqiSurah: '',
        sabqiFrom: '',
        sabqiTo: '',
        manzilSurah: '',
        manzilFrom: '',
        manzilTo: '',
        teacherNotes: '',
      });
    } catch {
      setError('Failed to log Hifz progress. Please verify the enrollment selection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !session) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-dark to-slate-900 p-8 text-white shadow-xl">
        <IslamicPattern opacity={0.1} />
        <h1 className="text-3xl font-serif font-bold text-gold">Log Daily Hifz Progress</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl">
          Record your student's daily 3-tier memorization milestones. Sabaq (new lesson), Sabqi (recent revision), and Manzil (past revision).
        </p>
      </div>

      <div className="max-w-2xl bg-surface dark:bg-slate-900 border border-gold/30 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Select Student / Enrollment
            </label>
            <select
              value={selectedEnrollmentId}
              onChange={(e) => setSelectedEnrollmentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              required
            >
              {enrollments.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.student?.fullName || 'Student'} — {e.courseName.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Sabaq */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
            <h4 className="font-semibold text-emerald-600 text-sm">1. Sabaq (New Lesson)</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Surah (1-114)"
                value={form.sabaqSurah}
                onChange={(e) => setForm({ ...form, sabaqSurah: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="From Ayah"
                value={form.sabaqFrom}
                onChange={(e) => setForm({ ...form, sabaqFrom: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="To Ayah"
                value={form.sabaqTo}
                onChange={(e) => setForm({ ...form, sabaqTo: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          {/* Sabqi */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
            <h4 className="font-semibold text-blue-600 text-sm">2. Sabqi (Recent Revision)</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Surah (1-114)"
                value={form.sabqiSurah}
                onChange={(e) => setForm({ ...form, sabqiSurah: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="From Ayah"
                value={form.sabqiFrom}
                onChange={(e) => setForm({ ...form, sabqiFrom: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="To Ayah"
                value={form.sabqiTo}
                onChange={(e) => setForm({ ...form, sabqiTo: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          {/* Manzil */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <h4 className="font-semibold text-amber-600 text-sm">3. Manzil (Past Revision)</h4>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="Surah (1-114)"
                value={form.manzilSurah}
                onChange={(e) => setForm({ ...form, manzilSurah: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="From Ayah"
                value={form.manzilFrom}
                onChange={(e) => setForm({ ...form, manzilFrom: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
              <input
                type="number"
                placeholder="To Ayah"
                value={form.manzilTo}
                onChange={(e) => setForm({ ...form, manzilTo: e.target.value })}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Teacher's Voice / Makharij Correction Notes
            </label>
            <textarea
              rows={3}
              value={form.teacherNotes}
              onChange={(e) => setForm({ ...form, teacherNotes: e.target.value })}
              placeholder="e.g. Focus on Madd Muttasil rules and Ikhfa ghunnah duration..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Check className="w-4 h-4 shrink-0" />
              <span>Hifz progress successfully logged!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark dark:bg-gold dark:text-slate-950 text-white font-semibold text-sm shadow-lg transition-all"
          >
            {submitting ? 'Saving Progress...' : 'Save Hifz Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
