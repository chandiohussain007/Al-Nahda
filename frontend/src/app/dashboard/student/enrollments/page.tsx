'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, ClipboardCheck, GraduationCap } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/data-display/StatusBadge';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import { apiErrorMessage, fetchMyStudentEnrollments } from '@/lib/api';
import type { StudentEnrollmentRecord, StudentEnrollmentStatus } from '@/lib/types';

/** Lifecycle order surfaced to the student; drives the per-card progress trail. */
const LIFECYCLE: StudentEnrollmentStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'ASSESSMENT_REQUIRED',
  'ASSESSMENT_COMPLETED',
  'APPROVED',
  'ACTIVE',
];

function stageIndex(status: StudentEnrollmentStatus): number {
  const i = LIFECYCLE.indexOf(status);
  return i === -1 ? 0 : i;
}

/** Full enrollment list for the signed-in student. */
export default function StudentEnrollmentsPage() {
  const [rows, setRows] = useState<StudentEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMyStudentEnrollments()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, 'Could not load your enrollments'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
            My enrollments
          </h1>
          <p className="m-0 mt-1 text-sm text-slate-500 dark:text-gold-light/70">
            Track each request as it moves through review, placement, and approval.
          </p>
        </div>
        <Link href="/dashboard/student/courses">
          <Button variant="secondary">Browse courses</Button>
        </Link>
      </header>

      {error && <ErrorCard message={error} className="mb-4" />}

      {loading ? (
        <SkeletonLoader rows={3} height="h-28" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No enrollments yet"
          description="Request a course from the catalog and it will appear here with live status updates."
          action={
            <Link href="/dashboard/student/courses">
              <Button variant="primary">Find a course</Button>
            </Link>
          }
        />
      ) : (
        <ul className="flex list-none flex-col gap-4 p-0">
          {rows.map((row) => (
            <li key={row.id}>
              <EnrollmentCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EnrollmentCard({ row }: { row: StudentEnrollmentRecord }) {
  const stage = stageIndex(row.status);
  const isRejected = row.status === 'REJECTED';

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
            {row.course?.name ?? 'Course'}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-gold-light/70">
            {row.selectedLevel && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Level: {row.selectedLevel.name}
              </span>
            )}
            {row.assignedAssessment && (
              <span className="inline-flex items-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" /> {row.assignedAssessment.title}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />{' '}
              {new Date(row.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <StatusBadge status={row.status} />
      </div>

      {!isRejected && (
        <ol className="m-0 flex list-none items-center gap-1 p-0">
          {LIFECYCLE.map((step, i) => (
            <li
              key={step}
              className="h-1.5 flex-1 rounded-full bg-sandstone transition-colors dark:bg-white/10"
              style={i <= stage ? { backgroundColor: '#176B68' } : undefined}
              title={step.replace(/_/g, ' ')}
            />
          ))}
        </ol>
      )}

      {(row.proposedFee != null || row.agreedFee != null) && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gold-light/70">
          <span>Fee:</span>
          {row.agreedFee != null ? (
            <Badge tone="success">Agreed &middot; {row.agreedFee}</Badge>
          ) : (
            <Badge tone="warning">Proposed &middot; {row.proposedFee}</Badge>
          )}
        </div>
      )}
    </Card>
  );
}
