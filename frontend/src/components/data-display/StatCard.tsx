import React from 'react';
import Card from '@/components/ui/Card';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Optional small caption under the value. */
  caption?: string;
}

/** Metric card for dashboard overviews. */
export default function StatCard({ label, value, caption, className = '', ...props }: StatCardProps) {
  return (
    <Card className={`flex flex-col gap-1 ${className}`} {...props}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gold-light/70">
        {label}
      </span>
      <span className="font-serif text-3xl font-bold text-primary dark:text-gold">
        {value}
      </span>
      {caption && (
        <span className="text-xs text-slate-500 dark:text-gold-light/70">{caption}</span>
      )}
    </Card>
  );
}
