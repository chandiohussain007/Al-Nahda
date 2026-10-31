'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useSession } from '@/lib/useSession';
import IslamicPattern from '@/components/decorative/IslamicPattern';

const MushaafViewer = dynamic(
  () => import('@/components/domain/mushaf/MushaafViewer'),
  { ssr: false, loading: () => <div className="p-8 text-center text-gold">Loading Mushaf...</div> }
);

export default function StudentMushafPage() {
  const { session, ready } = useSession('STUDENT');

  if (!ready || !session) return null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-dark to-slate-900 p-8 text-white shadow-xl">
        <IslamicPattern opacity={0.1} />
        <h1 className="text-3xl font-serif font-bold text-gold">Interactive Mushaf & Recitation</h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl">
          Ayah-by-ayah synced audio playback powered by global CDNs. Follow along with Uthmani script and word translations at zero server cost.
        </p>
      </div>

      <MushaafViewer />
    </div>
  );
}
