'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/lib/useSession';
import IslamicPattern from '@/components/decorative/IslamicPattern';

const MushaafViewer = dynamic(
  () => import('@/components/domain/mushaf/MushaafViewer'),
  { ssr: false, loading: () => <div className="p-8 text-center text-gold">Loading Mushaf...</div> }
);

export default function TeacherMushafPage() {
  const { session, ready } = useSession('TEACHER');

  if (!ready || !session) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-dark to-slate-900 p-8 text-white shadow-xl">
        <IslamicPattern opacity={0.1} />
        <h1 className="text-3xl font-serif font-bold text-gold">Teacher Classroom Reference Mushaf</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl">
          Use during live sessions and lessons to verify student recitation, pronunciations, and reference specific Ayahs alongside Zoom.
        </p>
      </div>

      <MushaafViewer />
    </div>
  );
}
