'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/useSession';
import { api } from '@/lib/api';
import IslamicPattern from '@/components/decorative/IslamicPattern';
import { BookOpen, Calendar, CheckCircle, Award } from 'lucide-react';

interface HifzRecord {
  id: string;
  date: string;
  sabaqSurah?: number;
  sabaqFrom?: number;
  sabaqTo?: number;
  sabqiSurah?: number;
  sabqiFrom?: number;
  sabqiTo?: number;
  manzilSurah?: number;
  manzilFrom?: number;
  manzilTo?: number;
  teacherNotes?: string;
}

export default function StudentHifzPage() {
  const { session, ready } = useSession('STUDENT');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>('');
  const [records, setRecords] = useState<HifzRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    api.get('/api/enrollment')
      .then((res) => {
        setEnrollments(res.data);
        if (res.data.length > 0) {
          setSelectedEnrollmentId(res.data[0].id);
        }
      })
      .catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!selectedEnrollmentId) return;
    setLoading(true);
    api.get(`/api/hifz/enrollment/${selectedEnrollmentId}`)
      .then((res) => setRecords(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedEnrollmentId]);

  if (!ready || !session) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-dark to-slate-900 p-8 text-white shadow-xl">
        <IslamicPattern opacity={0.1} />
        <h1 className="text-3xl font-serif font-bold text-gold">Daily Hifz Tracker</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl">
          Track your 3-tier memorization journey: Sabaq (New Lesson), Sabqi (Recent Revision), and Manzil (Long-term Retention).
        </p>
      </div>

      {enrollments.length > 1 && (
        <div className="flex gap-2">
          {enrollments.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEnrollmentId(e.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedEnrollmentId === e.id
                  ? 'bg-primary text-white dark:bg-gold dark:text-slate-950'
                  : 'bg-surface dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {e.courseName.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading your memorization logs...</div>
      ) : records.length === 0 ? (
        <div className="p-12 text-center bg-surface dark:bg-slate-900 rounded-2xl border border-gold/20 text-slate-500">
          No Hifz sessions logged yet. Your teacher will record daily Sabaq, Sabqi, and Manzil after each class.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl border border-gold/30 bg-surface dark:bg-slate-900 shadow-md space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                  Verified
                </span>
              </div>

              {/* Sabaq */}
              <div className="space-y-1 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Sabaq (New Lesson)</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {r.sabaqSurah ? `Surah ${r.sabaqSurah} • Ayahs ${r.sabaqFrom || 1}–${r.sabaqTo || 'End'}` : 'None logged'}
                </div>
              </div>

              {/* Sabqi */}
              <div className="space-y-1 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Sabqi (Recent Revision)</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {r.sabqiSurah ? `Surah ${r.sabqiSurah} • Ayahs ${r.sabqiFrom || 1}–${r.sabqiTo || 'End'}` : 'None logged'}
                </div>
              </div>

              {/* Manzil */}
              <div className="space-y-1 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <div className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Manzil (Past Revision)</span>
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {r.manzilSurah ? `Surah ${r.manzilSurah} • Ayahs ${r.manzilFrom || 1}–${r.manzilTo || 'End'}` : 'None logged'}
                </div>
              </div>

              {r.teacherNotes && (
                <div className="text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-2 italic">
                  Note: "{r.teacherNotes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
