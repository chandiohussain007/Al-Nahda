'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  translations?: Array<{ text: string }>;
}

const SURAHS = [
  { id: 1, name: 'Al-Fatihah', versesCount: 7 },
  { id: 2, name: 'Al-Baqarah', versesCount: 286 },
  { id: 3, name: 'Ali \'Imran', versesCount: 200 },
  { id: 18, name: 'Al-Kahf', versesCount: 110 },
  { id: 36, name: 'Ya-Sin', versesCount: 83 },
  { id: 55, name: 'Ar-Rahman', versesCount: 78 },
  { id: 67, name: 'Al-Mulk', versesCount: 30 },
  { id: 112, name: 'Al-Ikhlas', versesCount: 4 },
  { id: 113, name: 'Al-Falaq', versesCount: 5 },
  { id: 114, name: 'An-Nas', versesCount: 6 },
];

export function MushaafViewer() {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [page, setPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`https://api.quran.com/api/v4/verses/by_chapter/${selectedSurah}?language=en&words=false&translations=131&fields=text_uthmani&page=${page}&per_page=10`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data.verses) {
          setVerses(data.verses);
        }
      })
      .catch((err) => console.error('Failed to load verses:', err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSurah, page]);

  const playAyahAudio = (ayahNum: number) => {
    if (playingAyah === ayahNum && audioRef.current) {
      if (!audioRef.current.paused) {
        audioRef.current.pause();
        setPlayingAyah(null);
        return;
      }
    }

    const surahStr = String(selectedSurah).padStart(3, '0');
    const ayahStr = String(ayahNum).padStart(3, '0');
    // Open EveryAyah CDN free recitation audio (Mishary Rashid Alafasy)
    const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahStr}${ayahStr}.mp3`;

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {});
      setPlayingAyah(ayahNum);
      audioRef.current.onended = () => {
        setPlayingAyah(null);
      };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gold/30 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      <audio ref={audioRef} className="hidden" />

      {/* Surah List / Navigator */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 flex flex-col">
        <div className="flex items-center gap-2 mb-4 font-serif font-bold text-primary dark:text-gold text-lg">
          <BookOpen className="w-5 h-5" />
          <span>Surah Index</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-60 md:max-h-full">
          {SURAHS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSurah(s.id);
                setPage(1);
                setPlayingAyah(null);
                if (audioRef.current) audioRef.current.pause();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedSurah === s.id
                  ? 'bg-primary text-white dark:bg-gold dark:text-slate-950 font-semibold shadow'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span>{s.id}. {s.name}</span>
              <span className="text-xs opacity-75">{s.versesCount} v</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Mushaf Reader View */}
      <div className="flex-1 flex flex-col justify-between p-6 bg-surface dark:bg-slate-900">
        <div>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-serif font-bold text-primary dark:text-gold">
                {SURAHS.find((s) => s.id === selectedSurah)?.name || `Surah ${selectedSurah}`}
              </h2>
              <p className="text-xs text-slate-500">EveryAyah CDN • Pure Client-Side Rendering ($0 Cost)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">Page {page}</span>
              <button
                disabled={verses.length < 10}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <span className="animate-pulse">Loading Ayahs from Quran CDN...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {verses.map((v) => {
                const isPlaying = playingAyah === v.verse_number;
                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-xl transition-all border ${
                      isPlaying
                        ? 'border-gold bg-gold/5 dark:bg-gold/10'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <button
                        onClick={() => playAyahAudio(v.verse_number)}
                        className={`p-2 rounded-full border transition-colors ${
                          isPlaying
                            ? 'bg-gold text-slate-950 border-gold'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Listen to recitation"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <p
                        dir="rtl"
                        className="font-serif text-2xl md:text-3xl leading-loose text-right text-primary dark:text-gold flex-1 font-amiri"
                      >
                        {v.text_uthmani}
                        <span className="inline-block text-xs border border-gold/40 rounded-full px-2 py-0.5 mx-2 text-gold">
                          {v.verse_number}
                        </span>
                      </p>
                    </div>
                    {v.translations && v.translations[0] && (
                      <p
                        className="text-sm text-slate-600 dark:text-slate-300 pl-12 mt-1"
                        dangerouslySetInnerHTML={{ __html: v.translations[0].text }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Reciter: Sheikh Mishary Rashid Alafasy</span>
          <span>Ayah synced playback</span>
        </div>
      </div>
    </div>
  );
}
export default MushaafViewer;
