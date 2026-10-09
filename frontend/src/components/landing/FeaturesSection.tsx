'use client';

import React from 'react';
import { ShieldCheck, CalendarCheck, UserCheck, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FeaturesSectionProps {
  onLearnMore?: () => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const { t } = useLanguage();

  const features = [
    {
      title: t.features.secureLms.title,
      description: t.features.secureLms.desc,
      icon: ShieldCheck,
      iconColor: 'text-[#A96845] dark:text-[#E5D09A]',
      iconBg: 'bg-[#A96845]/10 dark:bg-white/10',
      badge: t.features.secureLms.badge,
      detail: t.features.secureLms.detail,
    },
    {
      title: t.features.attendance.title,
      description: t.features.attendance.desc,
      icon: CalendarCheck,
      iconColor: 'text-[#176B68] dark:text-[#E5D09A]',
      iconBg: 'bg-[#176B68]/10 dark:bg-white/10',
      badge: t.features.attendance.badge,
      detail: t.features.attendance.detail,
    },
    {
      title: t.features.chooseTeacher.title,
      description: t.features.chooseTeacher.desc,
      icon: UserCheck,
      iconColor: 'text-[#A96845] dark:text-[#E5D09A]',
      iconBg: 'bg-[#A96845]/10 dark:bg-white/10',
      badge: t.features.chooseTeacher.badge,
      detail: t.features.chooseTeacher.detail,
    },
    {
      title: t.features.certificates.title,
      description: t.features.certificates.desc,
      icon: Award,
      iconColor: 'text-[#176B68] dark:text-[#E5D09A]',
      iconBg: 'bg-[#176B68]/10 dark:bg-white/10',
      badge: t.features.certificates.badge,
      detail: t.features.certificates.detail,
    },
  ];

  return (
    <section
      id="features"
      className="py-20 bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8] dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-[#176B68] dark:text-[#E5D09A] mb-2">
            {t.features.kicker}
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1F33] dark:text-white tracking-tight">
            {t.features.title}
          </h2>
          <p className="text-sm md:text-base text-[#17212B]/75 dark:text-gray-300 mt-3">
            {t.features.subtitle}
          </p>
        </div>

        {/* 2x2 or 4x1 grid showcasing platform features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#0B1F33] rounded-xl p-6 border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} flex items-center justify-center transition-transform group-hover:scale-110 duration-200`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#0B1F33] dark:text-[#E5D09A] bg-[#F8F5EC] dark:bg-white/5 border border-[#DED7C8] dark:border-white/10 px-2 py-0.5 rounded">
                      {feature.badge}
                    </span>
                  </div>

                  {/* Title & Core Description */}
                  <h3 className="text-lg font-serif font-bold text-[#0B1F33] dark:text-white mb-2 group-hover:text-[#176B68] dark:group-hover:text-[#E5D09A] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-medium text-[#17212B] dark:text-gray-200 leading-relaxed mb-3">
                    {feature.description}
                  </p>
                  <p className="text-[12px] text-[#17212B]/70 dark:text-gray-300 leading-relaxed">
                    {feature.detail}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#DED7C8]/50 dark:border-white/10 flex items-center justify-between text-[11px] font-semibold text-[#176B68] dark:text-[#E5D09A]">
                  <span>System Standard</span>
                  <span className="text-[#A96845] dark:text-[#C6A15B]">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
