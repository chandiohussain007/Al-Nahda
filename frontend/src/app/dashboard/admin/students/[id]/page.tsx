'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable, { type Column } from '@/components/data-display/DataTable';
import StatusBadge from '@/components/data-display/StatusBadge';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import { apiErrorMessage, fetchAdminStudent } from '@/lib/api';
import type { AdminStudentDetail, EvaluationTest, Enrollment } from '@/lib/types';
import { ArrowLeft, User, Mail, Phone, Calendar, AlignLeft, BookOpen, Sparkles } from 'lucide-react';

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<AdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return undefined;

    let cancelled = false;

    fetchAdminStudent(id)
      .then((data) => {
        if (!cancelled) {
          setStudent(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, 'Could not load this student'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'course', header: 'Course', render: (r) => r.courseName },
    { key: 'level', header: 'Level', render: (r) => r.confirmedLevel },
    { key: 'teacher', header: 'Teacher', render: (r) => r.teacher?.fullName ?? '—' },
    { key: 'slot', header: 'Time Slot', secondary: true, render: (r) => r.preferredTimeSlot },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'requested', header: 'Requested', secondary: true, render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  const testColumns: Column<EvaluationTest>[] = [
    { key: 'claimed', header: 'Claimed', render: (t) => t.claimedLevel },
    { key: 'assigned', header: 'Assigned', render: (t) => t.assignedLevel },
    { key: 'score', header: 'Score', render: (t) => <span className="font-semibold">{t.score}%</span> },
    { key: 'status', header: 'Status', render: (t) => <Badge tone={t.status === 'PASSED' ? 'success' : 'warning'}>{t.status}</Badge> },
    { key: 'completed', header: 'Completed', secondary: true, render: (t) => t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '—' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
            Student Profile
          </h1>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="secondary" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to admin
          </Button>
        </Link>
      </header>

      {error && <ErrorCard message={error} />}
      {loading && (
        <div className="space-y-6">
          <SkeletonLoader rows={4} height="h-20" />
          <SkeletonLoader rows={3} height="h-32" />
        </div>
      )}

      {student && (
        <>
          <Card>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-sandstone/30 pb-4 dark:border-gold/20">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal dark:bg-teal/20 dark:text-gold-light">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="m-0 font-serif text-xl font-bold text-primary dark:text-gold">
                    {student.fullName}
                  </h2>
                  <span className="text-sm text-slate-500">Student ID: {student.id}</span>
                </div>
              </div>
              <Badge tone="info">{student.user?.role ?? 'STUDENT'}</Badge>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-charcoal dark:text-ivory">{student.user?.email ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-charcoal dark:text-ivory">{student.whatsappNumber ?? '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Joined: {student.user ? new Date(student.user.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
              <div>
                <div className="flex items-start gap-3 text-sm">
                  <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <span className="block font-medium text-slate-500 mb-1">Bio</span>
                    <p className="m-0 text-charcoal dark:text-ivory">{student.bio ?? '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-teal" />
              <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
                Enrollments ({student.enrollments.length})
              </h2>
            </div>
            <DataTable
              columns={enrollmentColumns}
              rows={student.enrollments}
              empty={<EmptyState title="No enrollments" description="This student has not enrolled in any legacy courses." />}
            />
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
                Evaluation Tests ({student.evaluationTests.length})
              </h2>
            </div>
            <DataTable
              columns={testColumns}
              rows={student.evaluationTests}
              empty={<EmptyState title="No evaluation tests" description="This student has not taken any evaluation tests." />}
            />
          </Card>
        </>
      )}
    </div>
  );
}
