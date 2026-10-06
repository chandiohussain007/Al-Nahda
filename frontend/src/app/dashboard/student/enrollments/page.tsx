'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { apiErrorMessage, fetchMyEnrollments } from '@/lib/api';
import type { Enrollment } from '@/lib/types';

/** Full enrollment list for the signed-in student (Progress only summarises). */
export default function StudentEnrollmentsPage() {
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchMyEnrollments()
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
    <>
      <div className="row">
        <h1>My enrollments</h1>
        <span className="spacer" />
        <Link href="/dashboard/student">← Back to dashboard</Link>
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Level</th>
                <th>Time slot</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.courseName}</td>
                  <td>{row.confirmedLevel}</td>
                  <td>{row.preferredTimeSlot}</td>
                  <td>{row.teacher?.fullName ?? '—'}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="muted">{new Date(row.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/dashboard/student/enrollments/${row.id}`}>View</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No enrollments yet — request one from your dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
