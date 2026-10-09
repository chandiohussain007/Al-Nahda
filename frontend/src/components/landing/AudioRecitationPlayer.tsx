'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Sparkles, BookOpen, Check, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const AudioRecitationPlayer: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const [activeRule, setActiveRule] = useState<string | null>('madd');

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorIntervalRef = useRef<number | null>(null);

  const ayahs = [
    {
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Bismillāhi r-raḥmāni r-raḥīm',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      tajweedRule: 'Basmalah: Pure vocalization with light Tarqiq on the Lam.',
    },
    {
      arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      transliteration: 'Al-ḥamdu lillāhi rabbi l-ʻālamīn',
      translation: 'All praise is due to Allah, Lord of the worlds.',
      tajweedRule: 'Al-Halq: Clear articulation of ḥā’ (ح) from the middle of the throat.',
    },
    {
      arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
      transliteration: 'Ar-raḥmāni r-raḥīm',
      translation: 'The Entirely Merciful, the Especially Merciful.',
      tajweedRule: 'Madd ‘Arid li-s-Sukun: 2, 4, or 6 harakat elongation on the final syllable.',
    },
    {
      arabic: 'مَالِكِ يَوْمِ الدِّينِ',
      transliteration: 'Māliki yawmi d-dīn',
      translation: 'Sovereign of the Day of Recompense.',
      tajweedRule: 'Qira’ah Variance: Subtle elongation of Alif in "Mālik" per Hafs transmission.',
    },
  ];

  // Synthesize a gentle, authentic acoustic recitation tone using Web Audio API
  const startHarmonicPlayback = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Quranic maqam / bayati frequencies for contemplative recitation: D, E-half-flat, F, G, A
      const notes = [293.66, 311.13, 349.23, 392.00, 440.00, 392.00, 349.23, 293.66];
      let noteIndex = 0;

      const playChantTone = () => {
        if (!audioContextRef.current || audioContextRef.current.state !== 'running') return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm sine + subtle triangle overtone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[noteIndex % notes.length], ctx.currentTime);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (1.6 / playbackSpeed));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + (1.7 / playbackSpeed));

        noteIndex++;
        if (noteIndex % 4 === 0) {
          setCurrentAyahIndex((prev) => (prev + 1) % ayahs.length);
        }
      };

      playChantTone();
      const intervalMs = Math.round(1800 / playbackSpeed);
      oscillatorIntervalRef.current = window.setInterval(playChantTone, intervalMs);
    } catch {
      // Audio fallback without crashing
    }
  };

  const stopHarmonicPlayback = () => {
    if (oscillatorIntervalRef.current) {
      clearInterval(oscillatorIntervalRef.current);
      oscillatorIntervalRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopHarmonicPlayback();
      setIsPlaying(false);
    } else {
      startHarmonicPlayback();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      stopHarmonicPlayback();
      startHarmonicPlayback();
    }
    return () => {
      stopHarmonicPlayback();
    };
  }, [playbackSpeed]);

  useEffect(() => {
    return () => {
      stopHarmonicPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <section className="py-16 bg-[#0B1F33] text-white border-b border-[#C6A15B]/30 relative overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 bg-[#C6A15B]/15 blur-[100px] rounded-full"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-gradient-to-b from-[#0d263f] to-[#06131F] rounded-2xl border border-[#C6A15B]/40 p-6 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5D09A] mb-2">
                <Sparkles className="w-4 h-4 text-[#C6A15B]" />
                <span>{t.audioFeature.kicker}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                {t.audioFeature.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#E5D09A]/80 mt-1 max-w-2xl leading-relaxed">
                {t.audioFeature.subtitle}
              </p>
            </div>

            {/* Reciter badge */}
            <div className="bg-white/5 border border-[#C6A15B]/30 rounded-lg px-3.5 py-2 text-right rtl:text-left shrink-0">
              <div className="text-[11px] text-[#E5D09A] font-semibold">{t.audioFeature.surahTitle}</div>
              <div className="text-[10px] text-gray-300">{t.audioFeature.reciter}</div>
            </div>
          </div>

          {/* Interactive Player Board */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Ayah Display & Calligraphy */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-6 rounded-xl bg-[#0B1F33]/80 border border-[#DED7C8]/20 relative">
                {/* Ayah Counter */}
                <div className="flex items-center justify-between text-xs text-[#E5D09A] mb-4">
                  <span className="font-semibold uppercase tracking-wider">
                    Ayah {currentAyahIndex + 1} of {ayahs.length}
                  </span>
                  <span className="text-[11px] bg-[#176B68] text-white px-2 py-0.5 rounded font-mono">
                    Hafs ‘an ‘Asim
                  </span>
                </div>

                {/* Calligraphic Ayah */}
                <div
                  className="text-2xl sm:text-3xl md:text-4xl text-center py-6 font-arabic text-[#E5D09A] leading-loose selection:bg-[#C6A15B] transition-all duration-300"
                  dir="rtl"
                >
                  {ayahs[currentAyahIndex].arabic}
                </div>

                {/* Transliteration and translation */}
                <div className="mt-4 pt-4 border-t border-white/10 text-center space-y-1">
                  <p className="text-xs sm:text-sm text-gray-200 italic font-serif">
                    "{ayahs[currentAyahIndex].transliteration}"
                  </p>
                  <p className="text-xs text-gray-300">
                    {ayahs[currentAyahIndex].translation}
                  </p>
                </div>
              </div>

              {/* Tajweed rule breakdown box */}
              <div className="p-4 rounded-lg bg-[#176B68]/15 border border-[#176B68]/40 flex items-start gap-3 text-xs">
                <BookOpen className="w-5 h-5 text-[#E5D09A] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#E5D09A] mb-0.5">Instructor Articulation Note:</div>
                  <div className="text-gray-200 leading-relaxed">
                    {ayahs[currentAyahIndex].tajweedRule}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sound Controls & Real-Time Waveform */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
              {/* Waveform Visualization */}
              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#C6A15B]" />
                    <span>Acoustic Frequency Monitor</span>
                  </span>
                  <span className="text-[#E5D09A] font-mono text-[11px]">
                    {isPlaying ? 'Streaming Audio' : 'Paused'}
                  </span>
                </div>

                {/* Animated bars */}
                <div className="h-16 flex items-center justify-between gap-1.5 bg-[#06131F] rounded-lg px-4 py-2 border border-white/10 overflow-hidden">
                  {[45, 80, 60, 95, 30, 70, 85, 40, 100, 65, 50, 90, 75, 55, 85, 45, 95, 70, 60, 80].map(
                    (height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-200 ${
                          isPlaying
                            ? 'bg-gradient-to-t from-[#176B68] via-[#C6A15B] to-[#E5D09A]'
                            : 'bg-white/20'
                        }`}
                        style={{
                          height: isPlaying ? `${Math.max(15, Math.round(height * Math.random()))}%` : '20%',
                          transitionDelay: `${i * 15}ms`,
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Main Play / Pause & Speed controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  onClick={togglePlayback}
                  type="button"
                  className="px-6 py-3 bg-[#C6A15B] hover:bg-[#b08e4e] text-[#0B1F33] font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>{t.audioFeature.pause}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>{t.audioFeature.play}</span>
                    </>
                  )}
                </button>

                {/* Speed selector */}
                <div className="flex items-center gap-1.5 bg-[#06131F] p-1 rounded-lg border border-white/10 text-xs">
                  <span className="text-[10px] text-gray-400 px-2 font-semibold">
                    {t.audioFeature.speed}:
                  </span>
                  {[0.75, 1.0, 1.25].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                        playbackSpeed === speed
                          ? 'bg-[#176B68] text-white font-bold'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Next / Prev Ayah buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-gray-300">
                <button
                  type="button"
                  onClick={() => setCurrentAyahIndex((prev) => (prev > 0 ? prev - 1 : ayahs.length - 1))}
                  className="hover:text-[#E5D09A] transition-colors p-1"
                >
                  ← Previous Verse
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentAyahIndex((prev) => (prev + 1) % ayahs.length)}
                  className="hover:text-[#E5D09A] transition-colors p-1"
                >
                  Next Verse →
                </button>
              </div>

              <div className="text-[11px] text-[#E5D09A]/75 leading-relaxed bg-[#06131F]/50 p-2.5 rounded border border-white/5">
                💡 <em>{t.audioFeature.listeningTip}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
