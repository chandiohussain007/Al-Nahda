'use client';

import React from 'react';
import { Compass, Shield, BookMarked } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { COURSE_IMAGES } from '@/data/coursesData';

const aboutImage = COURSE_IMAGES.history;

export const AboutSection: React.FC = () => {
  const { t, language } = useLanguage();

  const pillars = [
    {
      title:
        language === 'ar'
          ? 'سند متصل وأصالة علمية راسخة'
          : language === 'ur'
          ? 'مسلسل اسناد اور روایتی وقار'
          : 'Unbroken Sanad & Traditional Rigor',
      description:
        language === 'ar'
          ? 'إجازات علمية موثقة من كبرى حواضر العالم الإسلامي، تُدرّس بروح الإجلال والأمانة العلمية.'
          : language === 'ur'
          ? 'معروف اسلامی جامعات سے سند یافتہ اساتذہ کی زیر نگرانی مستند تعلیم۔'
          : 'Direct authorization lineages from venerated centers of Islamic learning, taught with reverence and methodology.',
      icon: BookMarked,
    },
    {
      title:
        language === 'ar'
          ? 'طرائق تدريس رقمية متقدمة'
          : language === 'ur'
          ? 'جدید ڈیجیٹل تدریسی ذرائع'
          : 'Modern E-Learning Pedagogies',
      description:
        language === 'ar'
          ? 'استوديوهات تفاعلية لتصحيح التلاوة، تسجيلات مرئية عالية الدقة، ومتابعة حية للمواظبة.'
          : language === 'ur'
          ? 'انٹرایکٹو تجوید اسٹوڈیو، ریکارڈ شدہ لیکچرز اور روزانہ حاضری مانیٹرنگ۔'
          : 'Interactive recitation studios, recorded archives, digital assignments, and real-time attendance dashboards.',
      icon: Compass,
    },
    {
      title:
        language === 'ar'
          ? 'بيئة إيمانية آمنة وجامعة'
          : language === 'ur'
          ? 'محفوظ اور باوقار علمی ماحول'
          : 'Safe, Dignified Digital Environment',
      description:
        language === 'ar'
          ? 'مجتمع تعليمي يراعي خصوصية العائلة المسلمة، خالٍ من الدعايات والمشتتات، ومصمم وفق أعلى معايير الأمان.'
          : language === 'ur'
          ? 'خاندانی اقدار کا تحفظ، اشتہارات سے پاک محفوظ پورٹل اور بین الاقوامی سیکیورٹی۔'
          : 'Family-centered community with ad-free portals, strict child-safety compliance, and supportive peer circles.',
      icon: Shield,
    },
  ];

  return (
    <section
      id="about"
      className="py-20 md:py-28 bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8] dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs uppercase font-bold tracking-widest text-[#176B68] dark:text-[#E5D09A]">
              {t.about.kicker}
            </div>

            {/* Deep rich headings */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#06131F] dark:text-white tracking-tight leading-[1.2]">
              {t.about.title}
            </h2>

            {/* Mission statement */}
            <p className="text-base sm:text-lg text-[#17212B]/85 dark:text-gray-200 leading-relaxed font-normal">
              {t.about.lead}
            </p>

            <p className="text-sm sm:text-base text-[#17212B]/75 dark:text-gray-300 leading-relaxed">
              {t.about.paragraph}
            </p>

            {/* Core Pillars */}
            <div className="space-y-4 pt-2">
              {pillars.map((pillar, idx) => {
                const IconComponent = pillar.icon;
                return (
                  <div key={idx} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-[#176B68]/10 dark:bg-white/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center shrink-0 mt-0.5">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#06131F] dark:text-white">
                        {pillar.title}
                      </h3>
                      <p className="text-xs text-[#17212B]/75 dark:text-gray-300 mt-0.5 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Column */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="p-3 bg-white dark:bg-[#0B1F33] rounded-2xl border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-xl">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#06131F] relative">
                  <img
                    src={aboutImage}
                    alt="Courtyard of traditional Islamic learning and scholarship"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06131F]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Overlay text on image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="text-[11px] uppercase tracking-wider text-[#E5D09A] font-semibold">
                      {t.about.imageTag}
                    </div>
                    <div className="text-sm font-serif font-bold text-white mt-0.5">
                      {t.about.imageSub}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative badge */}
              <div className="absolute -top-4 -left-4 rtl:-left-auto rtl:-right-4 bg-[#0B1F33] text-[#E5D09A] text-xs font-serif font-bold px-4 py-2 rounded-lg border border-[#C6A15B] shadow-md hidden sm:block">
                {t.about.est}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
