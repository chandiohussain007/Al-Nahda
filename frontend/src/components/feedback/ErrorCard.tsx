'use client';

import React from 'react';
import Button from '@/components/ui/Button';

export interface ErrorCardProps {
  title?: string;
  message: string;
  /** Shows a retry button when provided. */
  onRetry?: () => void;
  className?: string;
}

/** Styled error display with an optional retry action. */
export default function ErrorCard({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorCardProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300 ${className}`}
    >
      <p className="m-0 font-semibold">{title}</p>
      <p className="mb-3 mt-1 text-sm">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
