import React from 'react';

export type BadgeTone = 'neutral' | 'gold' | 'teal' | 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-ivory',
  gold: 'bg-gold-light/40 text-[#7a5f28] dark:bg-gold/20 dark:text-gold-light',
  teal: 'bg-teal/15 text-teal dark:bg-teal/30 dark:text-white',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

/** Compact status/label chip with design-system tones. */
export default function Badge({ tone = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
      {...props}
    />
  );
}
