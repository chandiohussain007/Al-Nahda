'use client';

import { useEffect, useState } from 'react';
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

const FEE_COLORS: Record<string, string> = {
  NONE: '#6b7280',
  PROPOSED: '#f59e0b',
  AGREED: '#10b981',
  REJECTED: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', ASSESSMENT_REQUIRED: '#8b5cf6',
  ASSESSMENT_COMPLETED: '#06b6d4', APPROVED: '#10b981', ACTIVE: '#10b981',
  REJECTED: '#ef4444', COMPLETED: '#6b7280',
};

export default function AdminEnrollmentsPage() {
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
    }).catch(() => {}).finally(() => setLoading(false));
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
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setFeeBusy(null);
    }
  }

  return (
    <div>
      <h1>Enrollment Management</h1>
      <p className="muted">Review and process student course applications.</p>

      {error && <p className="error-banner">{error}</p>}

      <div className="toolbar">
        <label>
          Filter by status:&nbsp;
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StudentEnrollmentStatus | '')}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <span className="muted">{enrollments.length} result{enrollments.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? <p className="muted">Loading…</p> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Level</th>
                <th>Status</th>
                <th>Assigned Exam</th>
                <th>Applied</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 ? (
                <tr><td colSpan={8} className="muted" style={{ textAlign: 'center' }}>No enrollments found.</td></tr>
              ) : enrollments.map((e) => (
                <tr key={e.id}>
                  <td>{e.student?.email ?? e.studentId}</td>
                  <td>{e.course?.name ?? '—'}</td>
                  <td>{e.selectedLevel?.name ?? '—'}</td>
                  <td>
                    <span className="status-badge" style={{ background: STATUS_COLORS[e.status] ?? '#6b7280' }}>
                      {e.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{e.assignedAssessment?.title ?? '—'}</td>
                  <td className="muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span
                        className="status-badge"
                        style={{ background: FEE_COLORS[e.feeStatus] ?? '#6b7280' }}
                      >
                        {e.feeStatus}
                      </span>
                      {e.proposedFee !== null && <span className="muted">#{e.proposedFee}</span>}
                      {e.agreedFee !== null && <span className="muted">→ #{e.agreedFee}</span>}
                    </div>
                    {e.feeStatus === 'PROPOSED' && (
                      <div className="row" style={{ gap: 6, marginTop: 4 }}>
                        <button
                          className="btn-sm"
                          disabled={feeBusy === e.id}
                          onClick={() => void approveFee(e)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-sm"
                          disabled={feeBusy === e.id}
                          onClick={() => void rejectFee(e)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn-sm" onClick={() => openModal(e)}>Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status update modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Enrollment Status</h2>
            <label>
              New Status
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as StudentEnrollmentStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            {newStatus === 'ASSESSMENT_REQUIRED' && (
              <label>
                Assign Placement Exam
                <select value={assignedAssessmentId} onChange={(e) => setAssignedAssessmentId(e.target.value)}>
                  <option value="">— None —</option>
                  {assessments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </label>
            )}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={!!updating} onClick={applyUpdate}>
                {updating ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
