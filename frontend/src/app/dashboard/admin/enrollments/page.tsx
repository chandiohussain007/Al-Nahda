'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/data-display/DataTable';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import StatusBadge from '@/components/data-display/StatusBadge';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { ClipboardList } from 'lucide-react';
import {
  apiErrorMessage,
  approveStudentEnrollmentFee,
  fetchAllStudentEnrollments,
  fetchAssessments,
  rejectStudentEnrollmentFee,
  updateEnrollmentStatus,
} from '@/lib/api';
import type { Assessment, StudentEnrollmentRecord, StudentEnrollmentStatus } from '@/lib/types';

const STATUSES: StudentEnrollmentStatus[] = [
  'PENDING','IN_PROGRESS','ASSESSMENT_REQUIRED','ASSESSMENT_COMPLETED',
  'APPROVED','REJECTED','ACTIVE','COMPLETED',
];

export default function AdminEnrollmentsPage() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<StudentEnrollmentRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [statusFilter, setStatusFilter] = useState<StudentEnrollmentStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Modal state
  const [modal, setModal] = useState<{ id: string; current: StudentEnrollmentStatus } | null>(null);
  const [newStatus, setNewStatus] = useState<StudentEnrollmentStatus>('PENDING');
  const [assignedAssessmentId, setAssignedAssessmentId] = useState('');
  const [feeBusy, setFeeBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAllStudentEnrollments(statusFilter || undefined),
      fetchAssessments(),
    ]).then(([enrs, asms]) => {
      setEnrollments(enrs);
      setAssessments(asms.filter((a) => a.status === 'PUBLISHED'));
    }).catch((e) => setError(apiErrorMessage(e))).finally(() => setLoading(false));
  }, [statusFilter]);

  function openModal(e: StudentEnrollmentRecord) {
    setModal({ id: e.id, current: e.status });
    setNewStatus(e.status);
    setAssignedAssessmentId(e.assignedAssessmentId ?? '');
  }

  async function applyUpdate() {
    if (!modal) return;
    setUpdating(modal.id);
    setError('');
    try {
      const updated = await updateEnrollmentStatus(modal.id, {
        status: newStatus,
        assignedAssessmentId: assignedAssessmentId || undefined,
      });
      setEnrollments((prev) => prev.map((e) => (e.id === modal.id ? updated : e)));
      setModal(null);
      toast('Enrollment status updated.', 'success');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setUpdating(null);
    }
  }

  async function approveFee(e: StudentEnrollmentRecord) {
    const input = window.prompt(
      'Agreed fee (leave blank to accept the proposed amount):',
      e.proposedFee === null ? '' : String(e.proposedFee),
    );
    if (input === null) return;

    const trimmed = input.trim();
    const agreedFee = trimmed === '' ? undefined : Number(trimmed);
    if (agreedFee !== undefined && (!Number.isFinite(agreedFee) || agreedFee < 0)) {
      setError('Enter a valid fee amount.');
      return;
    }

    setFeeBusy(e.id);
    setError('');
    try {
      const updated = await approveStudentEnrollmentFee(e.id, agreedFee);
      setEnrollments((prev) => prev.map((row) => (row.id === e.id ? updated : row)));
      toast('Fee approved.', 'success');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setFeeBusy(null);
    }
  }

  async function rejectFee(e: StudentEnrollmentRecord) {
    if (!window.confirm('Reject the proposed fee?')) return;

    setFeeBusy(e.id);
    setError('');
    try {
      const updated = await rejectStudentEnrollmentFee(e.id);
      setEnrollments((prev) => prev.map((row) => (row.id === e.id ? updated : row)));
      toast('Fee rejected.', 'info');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setFeeBusy(null);
    }
  }

  const getFeeTone = (status: string) => {
    switch (status) {
      case 'AGREED': return 'success';
      case 'PROPOSED': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  };

  const enrollmentColumns: Column<StudentEnrollmentRecord>[] = [
    { key: 'student', header: 'Student', render: (e) => <div className="font-medium text-primary dark:text-ivory">{e.student?.email ?? e.studentId}</div> },
    { key: 'course', header: 'Course', render: (e) => e.course?.name ?? '—' },
    { key: 'level', header: 'Level', secondary: true, render: (e) => e.selectedLevel?.name ?? '—' },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    { key: 'exam', header: 'Assigned Exam', secondary: true, render: (e) => e.assignedAssessment?.title ?? '—' },
    { key: 'applied', header: 'Applied', secondary: true, render: (e) => new Date(e.createdAt).toLocaleDateString() },
    {
      key: 'fee',
      header: 'Fee',
      render: (e) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm">
            <Badge tone={getFeeTone(e.feeStatus)}>{e.feeStatus}</Badge>
            {e.proposedFee !== null && <span className="text-slate-500 line-through">#{e.proposedFee}</span>}
            {e.agreedFee !== null && <span className="font-semibold text-green-600 dark:text-green-400">#{e.agreedFee}</span>}
          </div>
          {e.feeStatus === 'PROPOSED' && (
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="primary" disabled={feeBusy === e.id} onClick={() => void approveFee(e)}>Approve</Button>
              <Button size="sm" variant="danger" disabled={feeBusy === e.id} onClick={() => void rejectFee(e)}>Reject</Button>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      render: (e) => (
        <Button size="sm" variant="secondary" onClick={() => openModal(e)}>Update</Button>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 flex items-center gap-2 font-serif text-2xl font-bold text-primary dark:text-gold">
            <ClipboardList className="h-6 w-6" /> Enrollment Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Review and process student course applications.
          </p>
        </div>
      </header>

      {error && <ErrorCard message={error} />}

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface p-4 shadow-sm dark:bg-primary/50">
        <span className="text-sm font-medium text-slate-600 dark:text-ivory">Filter by status:</span>
        <Select
          className="w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StudentEnrollmentStatus | '')}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-sm text-slate-500">
          {enrollments.length} result{enrollments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card>
        {loading ? (
          <SkeletonLoader rows={5} height="h-16" />
        ) : (
          <DataTable
            columns={enrollmentColumns}
            rows={enrollments}
            empty={<EmptyState title="No enrollments found" description="Adjust your filters or wait for new applications." />}
          />
        )}
      </Card>

      {/* Status update modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="m-0 mb-4 font-serif text-xl font-bold text-primary dark:text-gold">
              Update Enrollment Status
            </h2>
            <div className="space-y-4">
              <FormField label="New Status">
                {(p) => (
                  <Select
                    {...p}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as StudentEnrollmentStatus)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>

              {newStatus === 'ASSESSMENT_REQUIRED' && (
                <FormField label="Assign Placement Exam">
                  {(p) => (
                    <Select
                      {...p}
                      value={assignedAssessmentId}
                      onChange={(e) => setAssignedAssessmentId(e.target.value)}
                    >
                      <option value="">— None —</option>
                      {assessments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title}
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-sandstone/30 pt-4 dark:border-gold/20">
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" disabled={!!updating} onClick={applyUpdate}>
                {updating ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
