'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  studentName?: string;
  duration?: number;
}

export function AudioPlayer({ src, studentName, duration }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  const cycleSpeed = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const rewind5 = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />

      <button
        onClick={togglePlay}
        className="p-2.5 rounded-full bg-primary text-white dark:bg-gold dark:text-slate-950 hover:opacity-90 shadow"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
          {studentName ? `${studentName}'s Recitation` : 'Recitation Audio'}
        </p>
        <p className="text-[10px] text-slate-400">
          Cloudflare R2 Direct Stream • {duration ? `${duration}s` : 'WebM Opus'}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={rewind5}
          title="Rewind 5 seconds"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs text-slate-600 dark:text-slate-400"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={cycleSpeed}
          title="Playback speed"
          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 min-w-10 text-center"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
}
export default AudioPlayer;
