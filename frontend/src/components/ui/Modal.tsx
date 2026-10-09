'use client';

import React, { useEffect } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Wide layout for pickers/builders. */
  large?: boolean;
}

/** Accessible dialog: overlay, Escape-to-close, scroll lock. */
export default function Modal({ open, onClose, title, children, footer, large = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${large ? 'max-w-3xl' : 'max-w-lg'} max-h-[85vh] overflow-y-auto rounded-xl border border-sandstone bg-surface p-6 text-charcoal shadow-2xl dark:border-gold/25 dark:bg-primary dark:text-ivory`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <h2 className="m-0 text-lg font-bold">{title}</h2>}
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="ml-auto rounded-md border border-sandstone px-2 py-1 text-sm hover:bg-sandstone/40 dark:border-gold/30 dark:hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
