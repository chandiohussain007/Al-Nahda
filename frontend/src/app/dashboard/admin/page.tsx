'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import {
  apiErrorMessage,
  approveEnrollment,
  approveTeacher,
  fetchAdminEnrollments,
  fetchAdminStudents,
  fetchAdminTeachers,
  rejectEnrollment,
  rejectTeacher,
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
                <td>{t.subjectsTaught.join(', ') || '—'}</td>
                <td>{t.experienceYears} yrs</td>
                <td>
                  <StatusBadge status={t.teacherStatus} />
                </td>
                <td>
                  {t.teacherStatus === 'PENDING' ? (
                    <div className="row">
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
                        onClick={() => void act('Teacher rejected.', () => rejectTeacher(t.id))}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No teachers match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row">
          <h2>Enrollments ({enrollments.length})</h2>
          <span className="spacer" />
          <label style={{ margin: 0 }}>
            Filter{' '}
            <select
              value={enrollmentFilter}
              onChange={(e) => setEnrollmentFilter(e.target.value as EnrollmentStatus | '')}
            >
              <option value="">All</option>
              {ENROLLMENT_STATUSES.map((s) => (
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
              <th>Student</th>
              <th>Teacher</th>
              <th>Course</th>
              <th>Level</th>
              <th>Time slot</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td>{e.student?.fullName ?? e.studentId}</td>
                <td>{e.teacher?.fullName ?? e.teacherId}</td>
                <td>{e.courseName}</td>
                <td>{e.confirmedLevel}</td>
                <td>{e.preferredTimeSlot}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
                <td>
                  {e.status === 'PENDING' ? (
                    <div className="row">
                      <button
                        type="button"
                        className="success"
                        disabled={busy}
                        onClick={() =>
                          void act('Enrollment activated.', () => approveEnrollment(e.id))
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() =>
                          void act('Enrollment rejected.', () => rejectEnrollment(e.id))
                        }
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && enrollments.length === 0 && (
              <tr>
                <td colSpan={7} className="muted">
                  No enrollments match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
