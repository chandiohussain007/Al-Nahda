'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiErrorMessage, applyForEnrollment, fetchMyStudentEnrollments } from '@/lib/api';
import type { StudentEnrollmentRecord } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  ASSESSMENT_REQUIRED: '#8b5cf6',
  ASSESSMENT_COMPLETED: '#06b6d4',
  APPROVED: '#10b981',
  ACTIVE: '#10b981',
  REJECTED: '#ef4444',
  COMPLETED: '#6b7280',
};

const COURSES = [
  { id: 'learn-quran', label: '📖 Learn Quran', description: 'Master Quran recitation from Noorani Qaida to full Hifz.' },
  { id: 'learn-arabic', label: '🌙 Learn Arabic', description: 'Classical Arabic from basics to understanding the Quran directly.' },
];

export default function StudentCoursesPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<StudentEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyStudentEnrollments()
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  const enrolledCourseIds = new Set(
    enrollments
      .filter((e) => !['REJECTED', 'COMPLETED'].includes(e.status))
      .map((e) => e.course?.slug),
  );

  async function handleApply(slug: string) {
    setApplying(slug);
    setError('');
    try {
      // We send the slug as applicationData since we don't have CourseItem IDs seeded yet.
      // When CourseItems are seeded, swap this to a real courseId lookup.
      const res = await applyForEnrollment({ courseId: slug, applicationData: slug });
      setEnrollments((prev) => [res, ...prev]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setApplying(null);
    }
  }

  return (
    <div className="courses-page">
      <h1>Courses</h1>
      <p className="muted">Choose a course to start your learning journey.</p>

      {error && <p className="error-banner">{error}</p>}

      <div className="course-grid">
        {COURSES.map((course) => {
          const enrolled = enrolledCourseIds.has(course.id);
          const myEnrollment = enrollments.find((e) => e.course?.slug === course.id);

          return (
            <div key={course.id} className="course-card">
              <h2>{course.label}</h2>
              <p>{course.description}</p>

              {myEnrollment && (
                <span
                  className="status-badge"
                  style={{ background: STATUS_COLORS[myEnrollment.status] ?? '#6b7280' }}
                >
                  {myEnrollment.status.replace(/_/g, ' ')}
                </span>
              )}

              {myEnrollment?.assignedAssessment && myEnrollment.status === 'ASSESSMENT_REQUIRED' && (
                <button
                  className="btn-primary"
                  onClick={() =>
                    router.push(
                      `/dashboard/student/exam?assessmentId=${myEnrollment.assignedAssessment!.id}&enrollmentId=${myEnrollment.id}`,
                    )
                  }
                >
                  Take Placement Exam →
                </button>
              )}

              {!enrolled && (
                <button
                  className="btn-primary"
                  disabled={applying === course.id}
                  onClick={() => handleApply(course.id)}
                >
                  {applying === course.id ? 'Applying…' : 'Apply Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loading ? (
        <p className="muted">Loading your enrollments…</p>
      ) : enrollments.length > 0 ? (
        <>
          <h2 style={{ marginTop: '2.5rem' }}>My Enrollments</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Assigned Exam</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td>{e.course?.name ?? '—'}</td>
                    <td>{e.selectedLevel?.name ?? '—'}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[e.status] ?? '#6b7280' }}
                      >
                        {e.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {e.assignedAssessment ? (
                        <button
                          className="btn-sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/student/exam?assessmentId=${e.assignedAssessment!.id}&enrollmentId=${e.id}`,
                            )
                          }
                        >
                          {e.assignedAssessment.title}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="muted">{new Date(e.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
