import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover elevation — use for interactive cards. */
  interactive?: boolean;
}

/** Surface container matching the landing page card style. */
export default function Card({
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-sandstone bg-surface p-5 text-charcoal shadow-sm transition-shadow duration-150 dark:border-gold/25 dark:bg-primary dark:text-ivory ${
        interactive
          ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    />
  );
}
