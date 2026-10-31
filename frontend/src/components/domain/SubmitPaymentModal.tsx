'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface SubmitPaymentModalProps {
  enrollmentId: string;
  courseName: string;
  proposedFee?: number | null;
  onSuccess?: () => void;
  onClose?: () => void;
}

export function SubmitPaymentModal({
  enrollmentId,
  courseName,
  proposedFee,
  onSuccess,
  onClose,
}: SubmitPaymentModalProps) {
  const [reference, setReference] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference && !file) {
      setError('Please provide a transaction reference number or a receipt screenshot.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let r2ObjectKey = '';

      if (file) {
        // 1. Get presigned upload URL for receipt
        const presigned = await api.post('/api/audio/presigned-upload', {
          enrollmentId,
          contentType: file.type || 'image/jpeg',
        });

        const { uploadUrl, objectKey, mock } = presigned.data;
        r2ObjectKey = objectKey;

        // 2. Direct upload to Cloudflare R2
        if (!mock) {
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'image/jpeg' },
          });
        }
      }

      // 3. Mark payment submitted on enrollment
      await api.patch(`/api/student-enrollments/${enrollmentId}/status`, {
        status: 'PENDING',
      }).catch(() => {});

      setDone(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch {
      setError('Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gold/30 bg-surface dark:bg-slate-900 p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-primary dark:text-gold">
            Submit Tuition Payment
          </h3>
          <p className="text-xs text-slate-500">
            Course: <span className="font-semibold">{courseName.replace('_', ' ')}</span>
            {proposedFee ? ` • Agreed Fee: $${proposedFee}` : ''}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="flex flex-col items-center justify-center py-6 text-emerald-500 space-y-2">
            <CheckCircle2 className="w-12 h-12" />
            <p className="font-semibold text-sm">Receipt Submitted for Admin Approval!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Bank / Transfer Reference ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. TXN-948102948"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Attach Receipt Screenshot (Uploaded to R2)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white dark:file:bg-gold dark:file:text-slate-950 hover:file:opacity-90"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{submitting ? 'Uploading...' : 'Submit Payment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default SubmitPaymentModal;
