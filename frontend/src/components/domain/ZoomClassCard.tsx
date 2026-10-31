'use client';

import React, { useState, useEffect } from 'react';
import { Video, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ZoomClassCardProps {
  teacherName: string;
  zoomLink?: string | null;
  scheduledTime?: string;
  enrollmentId?: string;
  onJoined?: () => void;
}

export function ZoomClassCard({
  teacherName,
  zoomLink,
  scheduledTime = 'Today at scheduled slot',
  enrollmentId,
  onJoined,
}: ZoomClassCardProps) {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    if (!zoomLink) return;
    setJoining(true);

    try {
      // Mark attendance if enrollmentId is provided
      if (enrollmentId) {
        await api.post('/api/attendance', {
          enrollmentId,
          date: new Date().toISOString(),
          status: 'PRESENT',
        });
      }
    } catch {
      // Best-effort attendance ping
    } finally {
      setJoined(true);
      setJoining(false);
      window.open(zoomLink, '_blank', 'noopener,noreferrer');
      onJoined?.();
    }
  };

  return (
    <div className="rounded-2xl border border-gold/30 bg-surface dark:bg-slate-900 p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{scheduledTime}</span>
        </div>
        <h3 className="text-lg font-serif font-bold text-primary dark:text-gold">
          Live Session with {teacherName}
        </h3>
        <p className="text-xs text-slate-500">
          Native 1-click Zoom launcher with automatic attendance logging.
        </p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {joined ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Attendance Marked</span>
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={!zoomLink || joining}
            className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all ${
              zoomLink
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{joining ? 'Connecting...' : zoomLink ? 'Join Live Zoom Class' : 'No Zoom Link Set'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
export default ZoomClassCard;
