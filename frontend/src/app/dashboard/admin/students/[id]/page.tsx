'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { apiErrorMessage, fetchAdminStudent } from '@/lib/api';
import type { AdminStudentDetail } from '@/lib/types';

/** Full admin view of one student: profile, enrollments and evaluations. */
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

  return (
    <>
      <div className="row">
        <h1>Student</h1>
        <span className="spacer" />
        <Link href="/dashboard/admin">← Back to admin</Link>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {student && (
        <>
          <div className="card">
            <div className="row">
              <h2>{student.fullName}</h2>
              <span className="spacer" />
              <span className="badge ok">{student.user?.role ?? 'STUDENT'}</span>
            </div>
            <table>
              <tbody>
                <tr>
                  <th>Email</th>
                  <td>{student.user?.email ?? '—'}</td>
                </tr>
                <tr>
                  <th>WhatsApp</th>
                  <td>{student.whatsappNumber ?? '—'}</td>
                </tr>
                <tr>
                  <th>Joined</th>
                  <td className="muted">
                    {student.user ? new Date(student.user.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
                <tr>
                  <th>Bio</th>
                  <td>{student.bio ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Enrollments ({student.enrollments.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Level</th>
                  <th>Teacher</th>
                  <th>Time slot</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {student.enrollments.map((row) => (
                  <tr key={row.id}>
                    <td>{row.courseName}</td>
                    <td>{row.confirmedLevel}</td>
                    <td>{row.teacher?.fullName ?? '—'}</td>
                    <td>{row.preferredTimeSlot}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {student.enrollments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No enrollments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Evaluation tests ({student.evaluationTests.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Claimed</th>
                  <th>Assigned</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {student.evaluationTests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.claimedLevel}</td>
                    <td>{test.assignedLevel}</td>
                    <td>{test.score}%</td>
                    <td>
                      <span className={`badge ${test.status === 'PASSED' ? 'ok' : 'warn'}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="muted">
                      {test.completedAt ? new Date(test.completedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {student.evaluationTests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      No evaluations taken yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
