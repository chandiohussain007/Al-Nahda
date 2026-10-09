'use client';

import React, { useId } from 'react';

interface FormFieldProps {
  label: string;
  /** Receives the generated id so label and control are linked. */
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  error?: string;
  hint?: string;
  className?: string;
}

/** Labeled control wrapper with error/hint wiring for accessibility. */
export default function FormField({ label, children, error, hint, className = '' }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const invalid = Boolean(error);
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-semibold text-charcoal dark:text-ivory">
        {label}
      </label>
      {children({ id, describedBy, invalid })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-gold-light/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
