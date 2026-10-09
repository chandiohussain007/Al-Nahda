'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Heart, Lock, BookOpen, ShieldCheck } from 'lucide-react';
import { Course } from '@/data/coursesData';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------- DONATE MODAL ----------------
interface DonateModalProps extends ModalBaseProps {}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const { isRtl } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<number | 'custom'>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'once' | 'monthly'>('once');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Donations are handled by an external payment processor (out of scope);
    // simulate the async confirmation locally.
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSuccess(false);
    onClose();
  };

  const tiers = [
    { amount: 25, label: 'Course Materials', desc: 'Digital texts & workbooks for 1 student' },
    { amount: 50, label: 'Guided Tuition', desc: '1 full month of learning support' },
    { amount: 100, label: 'Tajweed Studio', desc: '1-on-1 vocal lab sessions' },
    { amount: 250, label: 'Endowment Waqf', desc: 'Perpetual open access curriculum grant' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06131F]/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0B1F33] text-[#17212B] dark:text-white rounded-xl shadow-2xl border border-[#DED7C8] dark:border-[#C6A15B]/30 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1F33] dark:bg-[#06131F] text-white p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-gray-300 hover:text-white transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[#E5D09A] text-xs font-semibold tracking-wider uppercase mb-1">
            <Heart className="w-4 h-4 fill-current text-[#C6A15B]" />
            <span>Sadaqah Jariyah & Education Fund</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-white">Support Al Nahda's Mission</h2>
          <p className="text-xs text-[#E5D09A]/90 mt-1">
            Empower eager students with free & subsidized authentic Islamic education.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#176B68]/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif text-[#0B1F33] dark:text-white">May Allah Reward Your Generosity</h3>
              <p className="text-sm text-[#17212B]/80 dark:text-gray-300 max-w-sm mx-auto">
                Your pledge of <strong className="text-[#0B1F33] dark:text-[#E5D09A]">${selectedTier === 'custom' ? customAmount : selectedTier}</strong> has been received. A tax-deductible receipt has been dispatched to your email.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-[#0B1F33] dark:bg-[#C6A15B] text-white dark:text-[#0B1F33] font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Frequency */}
              <div className="flex rounded-lg bg-[#F8F5EC] dark:bg-white/5 p-1 border border-[#DED7C8] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setFrequency('once')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    frequency === 'once'
                      ? 'bg-white dark:bg-[#0B1F33] text-[#0B1F33] dark:text-white shadow-sm font-semibold'
                      : 'text-[#17212B]/70 dark:text-gray-300'
                  }`}
                >
                  One-time Donation
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    frequency === 'monthly'
                      ? 'bg-white dark:bg-[#0B1F33] text-[#0B1F33] dark:text-white shadow-sm font-semibold'
                      : 'text-[#17212B]/70 dark:text-gray-300'
                  }`}
                >
                  Monthly Contribution
                </button>
              </div>

              {/* Tiers */}
              <div className="grid grid-cols-2 gap-2.5">
                {tiers.map((t) => (
                  <button
                    key={t.amount}
                    type="button"
                    onClick={() => setSelectedTier(t.amount)}
                    className={`p-3 text-left rtl:text-right rounded-lg border text-sm transition-all ${
                      selectedTier === t.amount
                        ? 'border-[#C6A15B] bg-[#E5D09A]/15 dark:bg-[#C6A15B]/20 ring-2 ring-[#C6A15B]/30'
                        : 'border-[#DED7C8] dark:border-white/10 bg-white dark:bg-white/5 hover:border-[#C6A15B]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[#0B1F33] dark:text-white">
                      <span>${t.amount}</span>
                      {selectedTier === t.amount && (
                        <span className="w-2 h-2 rounded-full bg-[#C6A15B]" />
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#176B68] dark:text-[#E5D09A] mt-0.5">{t.label}</div>
                    <div className="text-[11px] text-[#17212B]/70 dark:text-gray-300 mt-1 leading-tight">{t.desc}</div>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1">
                  Or Custom Amount ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    placeholder="Other amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTier('custom');
                    }}
                    onFocus={() => setSelectedTier('custom')}
                    className="w-full pl-8 pr-3 rtl:pl-3 rtl:pr-8 py-2 text-sm border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B] bg-white dark:bg-white/5 text-[#17212B] dark:text-white"
                  />
                </div>
              </div>

              {/* Donor info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1">Full Name</label>
                  <input
                    type="text"
                    required={!isAnonymous}
                    disabled={isAnonymous}
                    placeholder="e.g. Bilal Hassan"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B] bg-white dark:bg-white/5 text-[#17212B] dark:text-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="bilal@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C6A15B] bg-white dark:bg-white/5 text-[#17212B] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-[#DED7C8] text-[#176B68] focus:ring-[#176B68]"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-[#17212B]/80 dark:text-gray-300 cursor-pointer">
                  Make this gift anonymous on public donor boards
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#C6A15B] hover:bg-[#b08e4e] text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : `Complete Donation of $${selectedTier === 'custom' ? customAmount || '0' : selectedTier}`}
                </span>
              </button>

              <p className="text-[11px] text-center text-[#17212B]/60 dark:text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B68] dark:text-[#E5D09A]" />
                <span>256-bit encryption. 100% Tax-deductible educational 501(c)(3) endowment.</span>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------- ENROLL MODAL ----------------
interface EnrollModalProps extends ModalBaseProps {
  course: Course | null;
}

export const EnrollModal: React.FC<EnrollModalProps> = ({ isOpen, onClose, course }) => {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [trackType, setTrackType] = useState<'live' | 'audit'>('live');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !course) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Donations are handled by an external payment processor (out of scope);
    // simulate the async confirmation locally.
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handleReset = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06131F]/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0B1F33] text-[#17212B] dark:text-white rounded-xl shadow-2xl border border-[#DED7C8] dark:border-[#C6A15B]/30 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B1F33] dark:bg-[#06131F] text-white p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 text-gray-300 hover:text-white transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-[#E5D09A] text-xs font-semibold tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4 text-[#C6A15B]" />
            <span>Course Enrollment</span>
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-white">{course.title}</h2>
          <div className="flex items-center gap-3 text-xs text-[#E5D09A] mt-2">
            <span>Instructor: {course.instructor.name}</span>
            <span>·</span>
            <span>Duration: {course.duration}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#176B68]/10 text-[#176B68] dark:text-[#E5D09A] flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif text-[#0B1F33] dark:text-white">Enrollment Confirmed!</h3>
              <p className="text-sm text-[#17212B]/80 dark:text-gray-300 max-w-sm mx-auto">
                Mubarak! You have been enrolled in <strong className="text-[#0B1F33] dark:text-[#E5D09A]">{course.title}</strong>. Orientation details have been sent to <strong className="text-[#0B1F33] dark:text-[#E5D09A]">{email}</strong>.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => { onClose(); router.push('/login'); }}
                  className="px-6 py-2.5 bg-[#176B68] text-white text-sm font-medium rounded-lg hover:bg-[#125553] transition-colors"
                >
                  Continue to LMS Sign-In →
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-[#F8F5EC] dark:bg-white/5 rounded-lg border border-[#DED7C8] dark:border-white/10">
                <div className="text-xs font-semibold text-[#0B1F33] dark:text-[#E5D09A] uppercase tracking-wider mb-1.5">
                  Curriculum Highlights
                </div>
                <ul className="text-xs text-[#17212B]/85 dark:text-gray-300 space-y-1">
                  {course.syllabusHighlights.slice(0, 3).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#176B68] dark:text-[#E5D09A] font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Format Choice */}
              <div>
                <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1.5">Select Format:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackType('live')}
                    className={`p-2.5 text-left rtl:text-right rounded-lg border text-xs transition-all ${
                      trackType === 'live'
                        ? 'border-[#176B68] bg-[#176B68]/10 text-[#0B1F33] dark:text-white font-medium ring-1 ring-[#176B68]'
                        : 'border-[#DED7C8] dark:border-white/20 text-[#17212B]/70 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-[#176B68] dark:text-[#E5D09A]">Live Interactive Cohort</div>
                    <div className="text-[11px] text-[#17212B]/70 dark:text-gray-400 mt-0.5">Live video circles + Q&A</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackType('audit')}
                    className={`p-2.5 text-left rtl:text-right rounded-lg border text-xs transition-all ${
                      trackType === 'audit'
                        ? 'border-[#176B68] bg-[#176B68]/10 text-[#0B1F33] dark:text-white font-medium ring-1 ring-[#176B68]'
                        : 'border-[#DED7C8] dark:border-white/20 text-[#17212B]/70 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-[#176B68] dark:text-[#E5D09A]">Self-Paced Guided Track</div>
                    <div className="text-[11px] text-[#17212B]/70 dark:text-gray-400 mt-0.5">Lectures + portal grading</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maryam Siddiqui"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DED7C8] dark:border-white/20 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17212B] dark:text-gray-200 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="maryam@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#DED7C8] dark:border-white/20 bg-white dark:bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68]"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-[#E5D09A]/60 dark:border-[#E5D09A]/30 flex items-center gap-2.5 text-xs text-[#17212B] dark:text-gray-200">
                <ShieldCheck className="w-5 h-5 text-[#C6A15B] shrink-0" />
                <span>
                  <strong>Certificate Guarantee:</strong> Verified digital certificate issued upon successful completion.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#176B68] hover:bg-[#125553] text-white font-semibold text-sm rounded-lg transition-all duration-200 shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Confirming Enrollment...' : 'Confirm My Spot Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
