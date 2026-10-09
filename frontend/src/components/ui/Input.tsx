import React from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Text input styled with the design-system tokens. */
export default function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-md border border-sandstone bg-surface px-3 py-2 min-h-[44px] text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60 dark:border-gold/30 dark:bg-deep dark:text-ivory dark:placeholder:text-gold-light/40 ${className}`}
      {...props}
    />
  );
}
