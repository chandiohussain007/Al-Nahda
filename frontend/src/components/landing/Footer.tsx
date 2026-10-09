'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ArrowUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  onOpenDonate: () => void;
  onOpenSignUp: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenDonate, onOpenSignUp }) => {
  const { t, language } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#06131F] text-white pt-16 pb-12 border-t border-[#C6A15B]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Donation CTA Box / Banner within the footer */}
        <div className="mb-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0B1F33] to-[#0d263f] border border-[#C6A15B]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left rtl:md:text-right">
            <div className="flex items-center justify-center md:justify-start rtl:md:justify-start gap-2 text-[#E5D09A] text-xs font-bold uppercase tracking-wider">
              <Heart className="w-4 h-4 text-[#A96845] fill-current" />
              <span>Sadaqah Jariyah Educational Waqf</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {t.footer.donateTitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#E5D09A]/80 max-w-xl">
              {t.footer.donateDesc}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOpenDonate}
              type="button"
              className="w-full sm:w-auto px-6 py-3 bg-[#A96845] hover:bg-[#925636] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t.footer.donateCta}</span>
            </button>
            <button
              onClick={onOpenSignUp}
              type="button"
              className="w-full sm:w-auto px-5 py-3 border border-[#E5D09A]/40 text-[#E5D09A] hover:bg-white/5 font-semibold text-xs uppercase tracking-wider rounded-lg transition-all text-center cursor-pointer"
            >
              {t.footer.joinCta}
            </button>
          </div>
        </div>

        {/* 4-column footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <a
              href="#home"
              onClick={(e) => handleSmoothScroll(e, '#home')}
              className="text-2xl font-serif font-bold tracking-tight text-white hover:text-[#E5D09A] transition-colors"
            >
              {language === 'ar' || language === 'ur' ? 'النهضة للتعليم الإسلامي' : 'Al Nahda'}
            </a>
            <p className="text-xs text-[#E5D09A]/80 leading-relaxed max-w-sm">
              {t.footer.bio}
            </p>
            <div className="text-[11px] text-[#E5D09A]/60 space-y-1">
              <p>{t.footer.tagline}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#E5D09A]">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleSmoothScroll(e, '#home')}
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  {t.nav.home}
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleSmoothScroll(e, '#about')}
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  {t.nav.about}
                </a>
              </li>
              <li>
                <a
                  href="#courses"
                  onClick={(e) => handleSmoothScroll(e, '#courses')}
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  {t.nav.courses}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSmoothScroll(e, '#features')}
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  {t.nav.features}
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleSmoothScroll(e, '#contact')}
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  {t.nav.contact}
                </a>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-gray-300 hover:text-[#E5D09A] transition-colors"
                >
                  Join our team
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#E5D09A]">
              {t.footer.legal}
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li>
                <span className="hover:text-[#E5D09A] transition-colors cursor-pointer">
                  {t.footer.privacy}
                </span>
              </li>
              <li>
                <span className="hover:text-[#E5D09A] transition-colors cursor-pointer">
                  {t.footer.terms}
                </span>
              </li>
              <li>
                <span className="hover:text-[#E5D09A] transition-colors cursor-pointer">
                  {t.footer.conduct}
                </span>
              </li>
            </ul>
          </div>

          {/* Academic Inquiries / Office Hours */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#E5D09A]">
              {t.footer.hours}
            </h4>
            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
              {t.footer.hoursText}
            </p>
            <div className="pt-2">
              <button
                onClick={scrollToTop}
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-[#E5D09A] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>{t.footer.backToTop}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Copyright Text at Absolute Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E5D09A]/70 gap-4">
          <p>
            &copy; {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p className="text-[11px] text-gray-400">
            {t.footer.motto}
          </p>
        </div>
      </div>
    </footer>
  );
};
