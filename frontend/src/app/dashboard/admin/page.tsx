'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import {
  apiErrorMessage,
  approveEnrollment,
  approveEnrollmentFee,
  approveTeacher,
  clearProfilePicture,
  clearTeacherCv,
  fetchAdminEnrollments,
  fetchAdminStudents,
  fetchAdminTeachers,
  rejectEnrollment,
  rejectEnrollmentFee,
  rejectTeacher,
  setProfilePicture,
  setTeacherCv,
} from '@/lib/api';
import {
  ENROLLMENT_STATUSES,
  TEACHER_STATUSES,
  type Enrollment,
  type EnrollmentStatus,
  type StudentProfile,
  type TeacherProfile,
  type TeacherStatus,
} from '@/lib/types';

const FEE_COLORS: Record<string, string> = {
  NONE: '#6b7280',
  PROPOSED: '#f59e0b',
  AGREED: '#10b981',
  REJECTED: '#ef4444',
};

export default function AdminPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminDashboard />
    </RequireRole>
  );
}

function AdminDashboard() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherFilter, setTeacherFilter] = useState<TeacherStatus | ''>('');
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherRows, studentRows, enrollmentRows] = await Promise.all([
        fetchAdminTeachers(teacherFilter || undefined),
        fetchAdminStudents(),
        fetchAdminEnrollments(enrollmentFilter || undefined),
      ]);
      setTeachers(teacherRows);
      setStudents(studentRows);
      setEnrollments(enrollmentRows);
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load admin data'));
    } finally {
      setLoading(false);
    }
  }, [teacherFilter, enrollmentFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (message: string, run: () => Promise<unknown>) => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      await run();
      setNotice(message);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  async function approveFeeWithPrompt(e: Enrollment) {
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

    await act('Fee agreed.', () => approveEnrollmentFee(e.id, agreedFee));
  }

  async function rejectFeeWithPrompt(e: Enrollment) {
    if (!window.confirm('Reject the proposed fee?')) return;
    await act('Fee rejected.', () => rejectEnrollmentFee(e.id));
  }

  /** Admin media moderation: paste a direct web link, or blank to clear. */
  async function changePicture(userId: string | undefined, name: string) {
    if (!userId) return;
    const input = window.prompt(`Profile picture URL for ${name} (blank to clear):`);
    if (input === null) return;

    const url = input.trim();
    await act(
      url ? 'Profile picture updated.' : 'Profile picture cleared.',
      () => (url ? setProfilePicture(userId, url) : clearProfilePicture(userId)),
    );
  }

  async function changeCv(userId: string | undefined, name: string) {
    if (!userId) return;
    const input = window.prompt(`CV link for ${name} (blank to clear):`);
    if (input === null) return;

    const url = input.trim();
    await act(
      url ? 'CV link updated.' : 'CV link cleared.',
      () => (url ? setTeacherCv(userId, url) : clearTeacherCv(userId)),
    );
  }

  return (
    <>
      <h1>Admin</h1>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}
      {loading && <p className="muted">Loading…</p>}

      <div className="card">
        <div className="row">
          <h2>Teachers ({teachers.length})</h2>
          <span className="spacer" />
          <label style={{ margin: 0 }}>
            Filter{' '}
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value as TeacherStatus | '')}
            >
              <option value="">All</option>
              {TEACHER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subjects</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td>{t.fullName}</td>
                <td>{t.user?.email ?? '—'}</td>
                <td>{t.phoneNumber ?? '—'}</td>
                <td>{t.subjectsTaught.join(', ') || '—'}</td>
                <td>{t.experienceYears} yrs</td>
                <td>
                  <StatusBadge status={t.teacherStatus} />
                </td>
                <td>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {t.teacherStatus === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          className="success"
                          disabled={busy}
                          onClick={() =>
                            void act('Teacher approved.', () => approveTeacher(t.id))
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() =>
                            void act('Teacher rejected.', () => rejectTeacher(t.id))
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn-sm"
                      disabled={busy || !t.userId}
                      onClick={() => void changePicture(t.userId, t.fullName)}
                    >
                      Picture
                    </button>
                    <button
                      type="button"
                      className="btn-sm"
                      disabled={busy || !t.userId}
                      onClick={() => void changeCv(t.userId, t.fullName)}
                    >
                      CV
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && teachers.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No teachers match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row">
          <h2>Enrollments ({enrollments.length} legacy)</h2>
          <span className="spacer" />
          <Link href="/dashboard/admin/enrollments">
            <button className="primary">Manage All Enrollments →</button>
          </Link>
        </div>
        <p className="muted">
          Enrollment management has moved to a dedicated page for the new workflow. 
          Use the button above to manage them.
        </p>
      </div>

      <div className="card">
        <h2>Students ({students.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.fullName}</td>
                <td>{s.user?.email ?? '—'}</td>
                <td className="muted">{new Date(s.user?.createdAt ?? '').toLocaleDateString()}</td>
                <td>
                  <Link href={`/dashboard/admin/students/${s.id}`}>View</Link>
                  {' · '}
                  <button
                    type="button"
                    className="btn-sm"
                    disabled={busy || !s.userId}
                    onClick={() => void changePicture(s.userId, s.fullName)}
                  >
                    Picture
                  </button>
                </td>
              </tr>
            ))}
            {!loading && students.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No students yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
