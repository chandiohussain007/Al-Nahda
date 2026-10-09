import React from 'react';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Select styled to match {@link Input}. */
export default function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-md border border-sandstone bg-surface px-3 py-2 min-h-[44px] text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60 dark:border-gold/30 dark:bg-deep dark:text-ivory ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
