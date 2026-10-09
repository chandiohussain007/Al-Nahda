'use client';

import React from 'react';
import { ArrowRight, ArrowLeft, Award } from 'lucide-react';
import { IslamicPattern } from '@/components/decorative/IslamicPattern';
import { useLanguage } from '@/context/LanguageContext';
import { COURSE_IMAGES } from '@/data/coursesData';

const heroImage = COURSE_IMAGES.academy;

interface HeroProps {
  onExploreCourses: () => void;
  onLearnMore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreCourses, onLearnMore }) => {
  const { t, isRtl } = useLanguage();

  return (
    <section
      id="home"
      className="relative bg-[#0B1F33] dark:bg-[#06131F] text-white pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden transition-colors duration-300"
    >
      {/* Subtle, low-opacity Islamic geometric pattern overlay */}
      <IslamicPattern opacity={0.12} />

      {/* Decorative radial lighting */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C6A15B]/10 blur-[120px] rounded-full"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left rtl:lg:text-right">
            {/* Authentic Tagline / Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[#E5D09A]/20 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B]" />
              <span className="text-xs uppercase tracking-widest text-[#E5D09A] font-semibold">
                {t.hero.kicker}
              </span>
            </div>

            {/* Headline text in White */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-white leading-[1.18] text-balance">
              {t.hero.headline}
            </h1>

            {/* Subheadline text in Champagne (#E5D09A) */}
            <p className="text-lg sm:text-xl font-normal text-[#E5D09A] max-w-2xl mx-auto lg:mx-0 leading-relaxed text-balance">
              {t.hero.subheadline}
            </p>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start rtl:lg:justify-start gap-4">
              <button
                onClick={onExploreCourses}
                type="button"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#C6A15B] hover:bg-[#b5924b] text-[#0B1F33] hover:text-[#06131F] font-bold text-sm tracking-wide rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 group"
              >
                <span>{t.hero.exploreCourses}</span>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                ) : (
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                )}
              </button>

              <button
                onClick={onLearnMore}
                type="button"
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent hover:bg-white/10 text-white font-semibold text-sm tracking-wide rounded-lg border border-white hover:border-[#E5D09A] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center"
              >
                {t.hero.learnMore}
              </button>
            </div>

            {/* Micro proof points */}
            <div className="pt-8 grid grid-cols-3 gap-4 border-t border-[#DED7C8]/20 max-w-xl mx-auto lg:mx-0 text-left rtl:text-right">
              <div>
                <div className="text-2xl md:text-3xl font-bold font-serif text-[#E5D09A] tabular-nums">
                  12,000+
                </div>
                <div className="text-xs text-gray-300 mt-0.5">{t.hero.statStudents}</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold font-serif text-[#E5D09A] tabular-nums">
                  45+
                </div>
                <div className="text-xs text-gray-300 mt-0.5">{t.hero.statScholars}</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold font-serif text-[#E5D09A] tabular-nums">
                  98.6%
                </div>
                <div className="text-xs text-gray-300 mt-0.5">{t.hero.statCompletion}</div>
              </div>
            </div>
          </div>

          {/* Visual Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="relative p-2.5 rounded-2xl bg-gradient-to-b from-[#C6A15B]/40 via-white/5 to-[#C6A15B]/20 border border-[#C6A15B]/40 shadow-2xl backdrop-blur-xs">
                <div className="relative rounded-xl overflow-hidden aspect-[4/3] lg:aspect-[5/4] bg-[#06131F]">
                  <img
                    src={heroImage}
                    alt="Al Nahda Islamic Academy Interior Sanctuary"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06131F]/90 via-[#06131F]/30 to-transparent pointer-events-none" />

                  {/* Floating badge inside image */}
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-[#0B1F33]/85 backdrop-blur-md border border-[#E5D09A]/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#176B68] text-white flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-[#E5D09A]" />
                      </div>
                      <div className="text-left rtl:text-right">
                        <div className="text-xs font-semibold text-white">{t.hero.mentorshipBadge}</div>
                        <div className="text-[11px] text-[#E5D09A]">{t.hero.classicalPedagogy}</div>
                      </div>
                    </div>
                    <div className="hidden sm:block text-right rtl:text-left">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#C6A15B] bg-[#06131F] px-2 py-1 rounded">
                        {t.hero.accreditedBadge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
