const fs = require('fs');
const jsx = `  return (
    <section className="py-16 lg:py-24 border-b border-white/10 bg-[#06131F]/30">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-[#E5D09A]">
          <Sparkles className="w-3 h-3" />
          <span>{t.audioFeature.title}</span>
        </div>
        <h2 className="text-3xl lg:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
          {t.audioFeature.subtitle}
        </h2>
        <p className="text-[#C6A15B]/90 text-base lg:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.audioFeature.description}
        </p>

        {/* Audio Player Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C6A15B] to-transparent" />

          {/* Active Ayah Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#C6A15B]/70 uppercase tracking-wider">
                Verse {currentAyahIndex + 1} of {ayahs.length}
              </span>
              <span className="text-xs font-mono text-[#E5D09A]/60">
                Surat Al-Fatiha
              </span>
            </div>
            <div dir="rtl" className="font-amiri text-4xl md:text-5xl font-bold text-primary mb-2">
              {ayahs[currentAyahIndex].arabic}
            </div>
            <p className="text-[#C6A15B]/60 text-sm mb-2 italic">
              {ayahs[currentAyahIndex].transliteration}
            </p>
            <p className="text-white/70 text-sm md:text-base max-w-lg mx-auto">
              {ayahs[currentAyahIndex].translation}
            </p>
            <p className="mt-3 text-xs text-[#E5D09A]/50 bg-white/5 px-3 py-2 rounded border border-white/10">
              <span className="font-semibold text-[#C6A15B]">Tajweed:</span> {ayahs[currentAyahIndex].tajweedRule}
            </p>
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} className="hidden" />

          {/* Waveform Visualization */}
          <div className="flex items-end justify-between gap-1 h-12 mb-6">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => (
              <div
                key={i}
                className={\`w-full bg-white/10 rounded-t-sm transition-all duration-300 \${isPlaying ? 'bg-[#C6A15B] animate-[wave_2s_ease-in-out_infinite]' : 'bg-white/10'}\`}
                style={{
                  height: isPlaying ? \`\${Math.max(15, Math.round(20 + Math.sin(i + Date.now() / 200) * 20))}%\` : '20%',
                  animationDelay: \${i * 80}ms,
                }}
              />
            ))}
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
                  className={\`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all \${playbackSpeed === speed ? 'bg-[#176B68] text-white font-bold' : 'text-gray-300 hover:text-white'}\`}
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
              onClick={handlePrevAyah}
              className="hover:text-[#E5D09A] transition-colors p-1"
            >
              ← Previous Verse
            </button>
            <button
              type="button"
              onClick={handleNextAyah}
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
    </section>
  );
};
`;
fs.appendFileSync('d:\\testing app\\Al Nahda\\frontend\\src\\components\\landing\\AudioRecitationPlayer.tsx', jsx, 'utf8');
console.log('JSX appended successfully');
