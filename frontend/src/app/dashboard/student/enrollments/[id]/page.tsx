'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import { apiErrorMessage, fetchEnrollment } from '@/lib/api';
import type { Enrollment } from '@/lib/types';

/** One enrollment with its full attendance history. */
export default function StudentEnrollmentDetailPage() {
  const { id: enrollmentId } = useParams<{ id: string }>();

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollmentId) return undefined;

    let cancelled = false;

    fetchEnrollment(enrollmentId)
      .then((data) => {
        if (!cancelled) {
          setEnrollment(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, 'Could not load this enrollment'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  const attendance = enrollment?.attendance ?? [];
  const present = attendance.filter((record) => record.status === 'PRESENT').length;
  const absent = attendance.filter((record) => record.status === 'ABSENT').length;
  const excused = attendance.filter((record) => record.status === 'EXCUSED').length;
  const rate = attendance.length === 0 ? 0 : Math.round((present / attendance.length) * 100);

  return (
    <>
      <div className="row">
        <h1>Enrollment</h1>
        <span className="spacer" />
        <Link href="/dashboard/student/enrollments">← All enrollments</Link>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {enrollment && (
        <div className="grid-2">
          <div className="card">
            <div className="row">
              <h2>Details</h2>
              <span className="spacer" />
              <StatusBadge status={enrollment.status} />
            </div>
            <table>
              <tbody>
                <tr>
                  <th>Course</th>
                  <td>{enrollment.courseName}</td>
                </tr>
                <tr>
                  <th>Level</th>
                  <td>{enrollment.confirmedLevel}</td>
                </tr>
                <tr>
                  <th>Time slot</th>
                  <td>{enrollment.preferredTimeSlot}</td>
                </tr>
                <tr>
                  <th>Teacher</th>
                  <td>{enrollment.teacher?.fullName ?? '—'}</td>
                </tr>
                <tr>
                  <th>Requested</th>
                  <td>{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Attendance</h2>

            {attendance.length === 0 ? (
              <p className="muted">No sessions recorded yet.</p>
            ) : (
              <>
                <div className="field-row">
                  <div>
                    <div className="muted">Attended</div>
                    <div className="stat">{rate}%</div>
                  </div>
                  <div>
                    <div className="muted">Present</div>
                    <div className="stat">{present}</div>
                  </div>
                  <div>
                    <div className="muted">Sessions</div>
                    <div className="stat">{attendance.length}</div>
                  </div>
                </div>

                <p className="muted">
                  Absent {absent} · Excused {excused}
                </p>

                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
