import React from 'react';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Textarea styled to match {@link Input}. */
export default function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full rounded-md border border-sandstone bg-surface px-3 py-2 min-h-[44px] text-sm text-charcoal placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60 dark:border-gold/30 dark:bg-deep dark:text-ivory dark:placeholder:text-gold-light/40 ${className}`}
      {...props}
    />
  );
}
