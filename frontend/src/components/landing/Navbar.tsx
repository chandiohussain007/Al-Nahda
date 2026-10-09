'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Globe, Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, Language } from '@/context/LanguageContext';
import { useTheme, ThemeMode } from '@/context/ThemeProvider';

interface NavbarProps {
  onOpenDonate: () => void;
  onOpenSignUp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDonate, onOpenSignUp }) => {
  const router = useRouter();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { theme, effectiveTheme, setTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const langMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const sections = ['home', 'courses', 'features', 'about', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.home, href: '#home', id: 'home' },
    { label: t.nav.courses, href: '#courses', id: 'courses' },
    { label: t.nav.features, href: '#features', id: 'features' },
    { label: t.nav.about, href: '#about', id: 'about' },
    { label: t.nav.contact, href: '#contact', id: 'contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-300">
      {/* 1. Top Hijri Announcement Ribbon */}
      <div className="bg-[#06131F] text-[#E5D09A] py-1.5 px-4 text-[11px] border-b border-[#C6A15B]/20">
        <div className="max-w-7xl mx-auto flex items-center">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] shrink-0" />
            <span className="font-medium truncate">{t.hijriDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#F8F5EC]/95 dark:bg-[#06131F]/95 backdrop-blur-md shadow-sm border-b border-[#DED7C8] dark:border-[#C6A15B]/30'
            : 'bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8]/70 dark:border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Zone 1: Single text element wordmark "Al Nahda" */}
            <div className="flex items-center">
              <a
                href="#home"
                onClick={(e) => handleNavClick(e, '#home')}
                className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-[#0B1F33] dark:text-white hover:opacity-90 transition-opacity"
              >
                {language === 'ar' || language === 'ur' ? 'النهضة' : 'Al Nahda'}
              </a>
            </div>

            {/* Zone 2: Navigation Links (Clean text links) */}
            <nav className="hidden lg:flex items-center space-x-7 rtl:space-x-reverse">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`text-sm font-medium tracking-wide transition-colors relative py-1 ${
                      isActive
                        ? 'text-[#0B1F33] dark:text-[#E5D09A] font-semibold'
                        : 'text-[#17212B]/80 dark:text-gray-300 hover:text-[#0B1F33] dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C6A15B] rounded-full" />
                    )}
                  </a>
                );
              })}
            </nav>

            {/* Zone 3: Actions + Language Switcher + Theme Switcher */}
            <div className="hidden lg:flex items-center space-x-3 rtl:space-x-reverse">
              {/* Language Switcher */}
              <div className="relative" ref={langMenuRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#DED7C8] dark:border-white/20 bg-white/60 dark:bg-white/5 text-xs text-[#0B1F33] dark:text-white font-medium hover:border-[#C6A15B] transition-colors flex items-center gap-1.5 cursor-pointer"
                  aria-label="Select language"
                >
                  <Globe className="w-3.5 h-3.5 text-[#176B68] dark:text-[#E5D09A]" />
                  <span>{currentLangObj.nativeName}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-36 rounded-lg bg-white dark:bg-[#0B1F33] border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-xl py-1 z-50 animate-fade-in text-xs">
                    {LANGUAGES.map((langItem) => (
                      <button
                        key={langItem.code}
                        type="button"
                        onClick={() => {
                          setLanguage(langItem.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rtl:text-right flex items-center justify-between hover:bg-[#F8F5EC] dark:hover:bg-white/10 transition-colors ${
                          language === langItem.code
                            ? 'font-bold text-[#176B68] dark:text-[#E5D09A] bg-[#176B68]/5'
                            : 'text-[#17212B] dark:text-gray-200'
                        }`}
                      >
                        <span>{langItem.nativeName}</span>
                        {language === langItem.code && <Check className="w-3.5 h-3.5 text-[#176B68] dark:text-[#E5D09A]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Switcher (System default with manual override) */}
              <div className="relative" ref={themeMenuRef}>
                <button
                  type="button"
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="p-2 rounded-lg border border-[#DED7C8] dark:border-white/20 bg-white/60 dark:bg-white/5 text-[#0B1F33] dark:text-[#E5D09A] hover:border-[#C6A15B] transition-colors flex items-center gap-1 cursor-pointer"
                  title={`Theme: ${theme} (Effective: ${effectiveTheme})`}
                  aria-label="Toggle dark and light theme"
                >
                  {theme === 'system' ? (
                    <Monitor className="w-4 h-4" />
                  ) : effectiveTheme === 'dark' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4 text-[#C6A15B]" />
                  )}
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-40 rounded-lg bg-white dark:bg-[#0B1F33] border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-xl py-1 z-50 animate-fade-in text-xs">
                    {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setTheme(mode);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rtl:text-right flex items-center justify-between hover:bg-[#F8F5EC] dark:hover:bg-white/10 transition-colors ${
                          theme === mode
                            ? 'font-bold text-[#176B68] dark:text-[#E5D09A] bg-[#176B68]/5'
                            : 'text-[#17212B] dark:text-gray-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 capitalize">
                          {mode === 'system' && <Monitor className="w-3.5 h-3.5" />}
                          {mode === 'light' && <Sun className="w-3.5 h-3.5 text-[#C6A15B]" />}
                          {mode === 'dark' && <Moon className="w-3.5 h-3.5 text-blue-400" />}
                          <span>{mode}</span>
                        </span>
                        {theme === mode && <Check className="w-3.5 h-3.5 text-[#176B68] dark:text-[#E5D09A]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {/* Donate button: Outline or subtle background using Gold #C6A15B */}
              <button
                onClick={onOpenDonate}
                type="button"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#C6A15B] border border-[#C6A15B] hover:bg-[#C6A15B]/10 rounded-lg transition-all duration-200 shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
              >
                {t.nav.donate}
              </button>

              {/* Sign Up button: Solid background using Jade Teal #176B68, text white */}
              <button
                onClick={() => router.push('/login')}
                type="button"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#176B68] border border-[#176B68]/50 hover:bg-[#176B68]/10 rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                Sign in
              </button>

              <Link
                href="/careers"
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#0B1F33] dark:text-[#E5D09A] border border-[#C6A15B]/50 hover:bg-[#C6A15B]/10 rounded-lg transition-all duration-200 whitespace-nowrap"
              >
                Join our team
              </Link>

              <button
                onClick={onOpenSignUp}
                type="button"
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#176B68] hover:bg-[#125553] rounded-lg transition-all duration-200 shadow-sm cursor-pointer whitespace-nowrap active:scale-95 hover:shadow-md"
              >
                Register
              </button>
            </div>

            {/* Mobile Hamburger button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-[#0B1F33] dark:text-white border border-[#DED7C8] dark:border-white/20"
                aria-label="Toggle theme"
              >
                {effectiveTheme === 'dark' ? <Moon className="w-4 h-4 text-[#E5D09A]" /> : <Sun className="w-4 h-4 text-[#C6A15B]" />}
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                className="p-2 rounded-lg text-[#0B1F33] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#176B68]"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#DED7C8] dark:border-white/10 bg-[#F8F5EC] dark:bg-[#06131F] px-4 pt-4 pb-6 space-y-4 shadow-lg animate-fade-in">
          {/* Mobile Language Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#DED7C8] dark:border-white/10">
            <span className="text-xs text-gray-500 dark:text-gray-400">Language / اللغة</span>
            <div className="flex gap-1.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    language === l.code
                      ? 'bg-[#176B68] text-white border-[#176B68] font-bold'
                      : 'border-[#DED7C8] dark:border-white/20 text-[#17212B] dark:text-gray-300'
                  }`}
                >
                  {l.nativeName}
                </button>
              ))}
            </div>
          </div>

          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-base font-medium py-2 px-3 rounded-md transition-colors ${
                  activeSection === link.id
                    ? 'bg-[#E5D09A]/30 dark:bg-white/10 text-[#0B1F33] dark:text-[#E5D09A] font-semibold'
                    : 'text-[#17212B] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-2 border-t border-[#DED7C8] dark:border-white/10 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDonate();
              }}
              type="button"
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#C6A15B] border border-[#C6A15B] hover:bg-[#C6A15B]/10 rounded-lg text-center transition-all cursor-pointer"
            >
              {t.nav.donate}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/login');
              }}
              type="button"
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#176B68] border border-[#176B68]/50 hover:bg-[#176B68]/10 rounded-lg text-center transition-all cursor-pointer"
            >
              Sign in
            </button>
            <Link
              href="/careers"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-[#0B1F33] dark:text-[#E5D09A] border border-[#C6A15B]/50 rounded-lg text-center transition-all"
            >
              Join our team
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSignUp();
              }}
              type="button"
              className="w-full py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-white bg-[#176B68] hover:bg-[#125553] rounded-lg text-center transition-all cursor-pointer"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
