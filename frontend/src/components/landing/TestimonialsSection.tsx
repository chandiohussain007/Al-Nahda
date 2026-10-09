'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const TestimonialsSection: React.FC = () => {
  const { t, language } = useLanguage();

  const testimonials = [
    {
      role: t.testimonials.parentReview,
      quote:
        language === 'ar'
          ? 'أحدثت منصة النهضة فارقاً عظيماً في فهم أبنائي للتاريخ الإسلامي والتراث الأصيل. المنصة آمنة جداً وسهلة الاستخدام.'
          : language === 'ur'
          ? 'النہضہ نے اسلامی تاریخ کے متعلق میرے بچوں کی فہم کو یکسر بدل دیا ہے۔ یہ پورٹل انتہائی محفوظ اور استعمال میں آسان ہے۔'
          : language === 'fr'
          ? 'Al Nahda a transformé la compréhension de l\'histoire islamique de mes enfants. La plateforme est remarquablement sécurisée et simple d\'utilisation.'
          : "Al Nahda has transformed my child's understanding of Islamic history. The platform is incredibly secure and easy to use.",
      author: 'Maryam Al-Mansoor',
      subtext: 'Mother of two enrolled students (Ages 10 & 13) · London, UK',
      avatarInitials: 'MA',
    },
    {
      role: t.testimonials.studentReview,
      quote:
        language === 'ar'
          ? 'القدرة على اختيار شيخي المفضل للتجويد صنعت الفارق الحقيقي في إتقاني وتصحيح التلاوة. أوصي بها بشدة!'
          : language === 'ur'
          ? 'اپنے تجوید کے استاد کا خود انتخاب کرنے کی سہولت نے میری تلاوت میں غیر معمولی نکھار پیدا کیا۔ میں پرزور سفارش کرتا ہوں!'
          : language === 'fr'
          ? 'Pouvoir choisir mon propre professeur de Tajweed a fait toute la différence. Je recommande vivement !'
          : 'Being able to choose my own Tajweed teacher made all the difference. Highly recommend!',
      author: 'Tariq Siddiqui',
      subtext: 'Advanced Tajweed & Recitation Student · Toronto, Canada',
      avatarInitials: 'TS',
    },
    {
      role: t.testimonials.studentReview,
      quote:
        language === 'ar'
          ? 'برنامج اللغة العربية الكلاسيكية يتميز بعمق منهجي لم أجده في أي مكان آخر. نظام الحضور والتكليفات حافظ على استمراري ومواظبتي.'
          : language === 'ur'
          ? 'کلاسیکی عربی کا نصاب گہری بصیرت فراہم کرتا ہے۔ حاضری اور ہوم ورک کی پابندی نے مجھے مسلسل متحرک رکھا۔'
          : language === 'fr'
          ? 'Le programme d\'arabe classique offre une profondeur unique. Le suivi régulier et l\'assiduité m\'ont permis de progresser continuellement.'
          : 'The Classical Arabic program possesses clarity and depth I could not find anywhere else. The live feedback and attendance tracking kept me accountable week after week.',
      author: 'Zainab El-Amine',
      subtext: 'University Graduate & Arabic Fellow · Sydney, Australia',
      avatarInitials: 'ZE',
    },
    {
      role: t.testimonials.parentReview,
      quote:
        language === 'ar'
          ? 'بصفتنا آباء نعيش في الغرب، فإن وجود بيئة رقمية مباركة تضم علماء موثوقين ومناهج رصينة يمنحنا طمأنينة لا تقدر بثمن.'
          : language === 'ur'
          ? 'مغرب میں مقیم ہونے کے ناطے، باکردار اور مستند اساتذہ کے ساتھ بچوں کی تربیت ہمارے لیے بہت بڑی نعمت ہے۔'
          : language === 'fr'
          ? 'En tant que parents vivants en occident, disposer d\'un cadre sécurisé avec des savants dignes et rigoureux est une bénédiction pour notre famille.'
          : 'As parents raising children in the West, having a safe digital space with dignified, certified scholars gives us immense peace of mind. Their character shines in every session.',
      author: 'Dr. Harun & Salma Qureshi',
      subtext: 'Parents of 3 students · Chicago, USA',
      avatarInitials: 'HQ',
    },
  ];

  return (
    <section className="py-20 bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8] dark:border-white/10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-[#176B68] dark:text-[#E5D09A] mb-2">
            {t.testimonials.kicker}
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1F33] dark:text-white tracking-tight">
            {t.testimonials.title}
          </h2>
          <p className="text-sm md:text-base text-[#17212B]/75 dark:text-gray-300 mt-3">
            {t.testimonials.subtitle}
          </p>
        </div>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((tItem, idx) => (
            <div
              key={idx}
              className="bg-[#E5D09A]/20 dark:bg-[#0B1F33]/60 border border-[#DED7C8] dark:border-[#C6A15B]/30 rounded-xl p-6 sm:p-7 transition-all duration-300 hover:shadow-md hover:border-[#C6A15B] flex flex-col justify-between"
            >
              <div>
                {/* 5-Star Ratings & Role */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#C6A15B]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C6A15B] text-[#C6A15B]" />
                    ))}
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B1F33] dark:text-[#E5D09A] bg-white/80 dark:bg-white/10 border border-[#DED7C8] dark:border-white/10 px-2.5 py-0.5 rounded-full">
                    {tItem.role}
                  </span>
                </div>

                {/* Quote */}
                <div className="relative">
                  <Quote className="w-8 h-8 text-[#C6A15B]/25 absolute -top-2 -left-2 rtl:-left-auto rtl:-right-2 pointer-events-none" />
                  <p className="text-sm sm:text-base text-[#17212B] dark:text-gray-200 font-medium leading-relaxed italic relative z-10 px-2">
                    "{tItem.quote}"
                  </p>
                </div>
              </div>

              {/* Author & Avatar */}
              <div className="mt-6 pt-4 border-t border-[#DED7C8] dark:border-white/10 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#0B1F33] text-[#E5D09A] font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-xs border border-[#C6A15B]/30">
                  {tItem.avatarInitials}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-serif font-bold text-[#0B1F33] dark:text-white truncate">
                    {tItem.author}
                  </div>
                  <div className="text-xs text-[#17212B]/70 dark:text-gray-400 truncate">
                    {tItem.subtext}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
