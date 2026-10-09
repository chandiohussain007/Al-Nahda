import type { BadgeTone } from '@/components/ui/Badge';

/**
 * Single source of truth for status presentation (plan issue #16 — no more
 * magic color maps scattered across pages).
 */
export const STATUS_STYLES: Record<string, { label: string; tone: BadgeTone }> = {
  // Student enrollment lifecycle
  PENDING: { label: 'Pending', tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'teal' },
  ASSESSMENT_REQUIRED: { label: 'Assessment required', tone: 'gold' },
  ASSESSMENT_COMPLETED: { label: 'Assessment completed', tone: 'teal' },
  APPROVED: { label: 'Approved', tone: 'success' },
  ACTIVE: { label: 'Active', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },

  // Assessment / attempt states
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
  SUBMITTED: { label: 'Submitted', tone: 'teal' },
  EXPIRED: { label: 'Expired', tone: 'danger' },

  // Evaluation results
  PASSED: { label: 'Passed', tone: 'success' },
  FAILED: { label: 'Failed', tone: 'danger' },

  // Fee workflow
  NONE: { label: '—', tone: 'neutral' },
  PROPOSED: { label: 'Fee proposed', tone: 'gold' },
  AGREED: { label: 'Fee agreed', tone: 'success' },

  // Profiles
  APPROVED_TEACHER: { label: 'Approved', tone: 'success' },
  PENDING_TEACHER: { label: 'Pending review', tone: 'warning' },
};

export function statusLabel(status: string): string {
  return STATUS_STYLES[status]?.label ?? status.replace(/_/g, ' ');
}

export function statusTone(status: string): BadgeTone {
  return STATUS_STYLES[status]?.tone ?? 'neutral';
}
