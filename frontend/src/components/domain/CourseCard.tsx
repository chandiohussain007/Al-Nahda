'use client';

import React from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export interface CourseCardProps {
  title: string;
  description?: string;
  /** Emoji/icon shown in the corner badge. */
  icon?: string;
  /** Status chip text (e.g. enrollment status), when relevant. */
  statusLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  children?: React.ReactNode;
}

/** Rich course card matching the landing page's catalog style. */
export default function CourseCard({
  title,
  description,
  icon = '📖',
  statusLabel,
  actionLabel,
  onAction,
  actionDisabled = false,
  children,
}: CourseCardProps) {
  return (
    <article className="group flex h-full flex-col gap-3 rounded-xl border border-sandstone bg-surface p-5 text-charcoal shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:border-gold/25 dark:bg-primary dark:text-ivory">
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold-light/30 text-xl dark:bg-gold/20"
        >
          {icon}
        </span>
        {statusLabel && <Badge tone="gold">{statusLabel}</Badge>}
      </div>

      <h2 className="m-0 font-serif text-lg font-bold text-primary dark:text-gold">{title}</h2>
      {description && <p className="m-0 text-sm text-slate-600 dark:text-gold-light/80">{description}</p>}

      {children}

      {actionLabel && onAction && (
        <div className="mt-auto pt-2">
          <Button variant="secondary" onClick={onAction} disabled={actionDisabled} className="w-full">
            {actionLabel}
          </Button>
        </div>
      )}
    </article>
  );
}
