import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Call-to-action rendered under the description. */
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

/** Shown when a list/collection has no data — always offer a next step. */
export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sandstone bg-surface/60 px-6 py-10 text-center dark:border-gold/25 dark:bg-primary/40">
      <div aria-hidden className="text-3xl text-gold">
        {icon ?? '◇'}
      </div>
      <h3 className="m-0 text-base font-semibold text-charcoal dark:text-ivory">{title}</h3>
      {description && (
        <p className="m-0 max-w-md text-sm text-slate-500 dark:text-gold-light/70">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
