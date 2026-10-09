'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const ContactSection: React.FC = () => {
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 500);
  };

  return (
    <section
      id="contact"
      className="py-20 md:py-28 bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8] dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase font-bold tracking-widest text-[#176B68] dark:text-[#E5D09A] mb-2">
            {t.contact.kicker}
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1F33] dark:text-white tracking-tight">
            {t.contact.title}
          </h2>
          <p className="text-sm md:text-base text-[#17212B]/75 dark:text-gray-300 mt-3">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Clean centered contact form */}
        <div className="max-w-3xl mx-auto bg-white dark:bg-[#0B1F33] rounded-2xl border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-sm p-6 sm:p-10 transition-colors duration-300">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#176B68]/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-[#0B1F33] dark:text-white">
                {t.contact.successTitle}
              </h3>
              <p className="text-sm text-[#17212B]/80 dark:text-gray-300 max-w-md mx-auto">
                {t.contact.successMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', subject: '', message: '' });
                }}
                className="mt-4 px-6 py-2.5 bg-[#0B1F33] dark:bg-[#C6A15B] text-white dark:text-[#0B1F33] text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#06131F] dark:hover:bg-[#b08e4e] transition-all cursor-pointer font-bold"
              >
                {t.contact.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1.5">
                    {t.contact.nameLabel} <span className="text-[#A96845]">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="e.g. Zayd Ibrahim"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC]/40 dark:bg-white/5 text-[#17212B] dark:text-white border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68] focus:bg-white dark:focus:bg-white/10 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1.5">
                    {t.contact.emailLabel} <span className="text-[#A96845]">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="zayd@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC]/40 dark:bg-white/5 text-[#17212B] dark:text-white border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68] focus:bg-white dark:focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="contact-subject" className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1.5">
                  {t.contact.subjectLabel} <span className="text-[#A96845]">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  placeholder="e.g. Question regarding Tajweed placement level"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC]/40 dark:bg-white/5 text-[#17212B] dark:text-white border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68] focus:bg-white dark:focus:bg-white/10 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1.5">
                  {t.contact.messageLabel} <span className="text-[#A96845]">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  placeholder="How can we assist your learning journey?"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-[#F8F5EC]/40 dark:bg-white/5 text-[#17212B] dark:text-white border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68] focus:bg-white dark:focus:bg-white/10 transition-all resize-y"
                />
              </div>

              {/* Button: "Send Message" in Persian Midnight (#0B1F33) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-[#0B1F33] dark:bg-[#C6A15B] hover:bg-[#06131F] dark:hover:bg-[#b08e4e] text-white dark:text-[#0B1F33] font-semibold text-sm tracking-wide rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#E5D09A] dark:text-[#0B1F33]" />
                <span>{isSubmitting ? t.contact.sending : t.contact.sendButton}</span>
              </button>
            </form>
          )}

          {/* Info beside/below the form */}
          <div className="mt-10 pt-8 border-t border-[#DED7C8] dark:border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left rtl:sm:text-right">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F8F5EC] dark:bg-white/10 border border-[#DED7C8] dark:border-white/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <div className="text-[11px] uppercase tracking-wider text-[#17212B]/60 dark:text-gray-400 font-semibold">
                  {t.contact.campus}
                </div>
                <div className="text-xs text-[#0B1F33] dark:text-gray-200 font-medium mt-0.5">
                  742 Academic Row, Knowledge Park, Suite 400
                </div>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F8F5EC] dark:bg-white/10 border border-[#DED7C8] dark:border-white/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <div className="text-[11px] uppercase tracking-wider text-[#17212B]/60 dark:text-gray-400 font-semibold">
                  {t.contact.email}
                </div>
                <a
                  href="mailto:admissions@alnahda.edu"
                  className="text-xs text-[#0B1F33] dark:text-gray-200 font-medium mt-0.5 hover:text-[#176B68] dark:hover:text-[#E5D09A] transition-colors"
                >
                  admissions@alnahda.edu
                </a>
              </div>
            </div>

            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F8F5EC] dark:bg-white/10 border border-[#DED7C8] dark:border-white/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <div className="text-[11px] uppercase tracking-wider text-[#17212B]/60 dark:text-gray-400 font-semibold">
                  {t.contact.phone}
                </div>
                <a
                  href="tel:+18005821492"
                  className="text-xs text-[#0B1F33] dark:text-gray-200 font-medium mt-0.5 hover:text-[#176B68] dark:hover:text-[#E5D09A] transition-colors"
                  dir="ltr"
                >
                  +1 (800) 582-1492
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
