'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import CourseCard from '@/components/domain/CourseCard';
import StatusBadge from '@/components/data-display/StatusBadge';
import DataTable, { type Column } from '@/components/data-display/DataTable';
import ErrorCard from '@/components/feedback/ErrorCard';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import {
  apiErrorMessage,
  applyForEnrollment,
  fetchCourses,
  fetchMyStudentEnrollments,
  fetchStudentProfile,
} from '@/lib/api';
import type { CourseItem, StudentEnrollmentRecord, StudentProfile } from '@/lib/types';

/** Presentation fallbacks keyed by slug; API data wins when present. */
const COURSE_DETAILS: Record<string, { label: string; description: string; icon: string }> = {
  'learn-quran': {
    label: 'Learn Quran',
    description: 'Master Quran recitation from Noorani Qaida to full Hifz.',
    icon: '📖',
  },
  'learn-arabic': {
    label: 'Learn Arabic',
    description: 'Classical Arabic from basics to understanding the Quran directly.',
    icon: '🌙',
  },
};

export default function StudentCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Courses load independently: a missing profile must not blank the catalog.
    fetchCourses()
      .then(setCourses)
      .catch((err) => setError(apiErrorMessage(err, 'Could not load courses')));

    fetchStudentProfile()
      .then((p) => {
        setProfile(p);
        return fetchMyStudentEnrollments();
      })
      .then(setEnrollments)
      .catch(() => {
        setProfile(null);
        setEnrollments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const enrolledCourseSlugs = new Set(
    enrollments
      .filter((e) => !['REJECTED', 'COMPLETED'].includes(e.status))
      .map((e) => e.course?.slug),
  );

  async function handleApply(course: CourseItem) {
    setApplying(course.id);
    setError('');
    try {
      // course.id is the real CourseItem UUID the DTO validates.
      const res = await applyForEnrollment({ courseId: course.id, applicationData: course.slug });
      setEnrollments((prev) => [res, ...prev]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setApplying(null);
    }
  }

  const examLink = (assessmentId: string, enrollmentId: string) =>
    `/dashboard/student/exam?assessmentId=${assessmentId}&enrollmentId=${enrollmentId}`;

  const enrollmentColumns: Column<StudentEnrollmentRecord>[] = [
    { key: 'course', header: 'Course', render: (e) => e.course?.name ?? '—' },
    { key: 'level', header: 'Level', secondary: true, render: (e) => e.selectedLevel?.name ?? '—' },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'assessment',
      header: 'Assigned Exam',
      secondary: true,
      render: (e) =>
        e.assignedAssessment ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(examLink(e.assignedAssessment!.id, e.id))}
          >
            {e.assignedAssessment.title}
          </Button>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Applied',
      secondary: true,
      render: (e) => (
        <span className="text-slate-500 dark:text-gold-light/70">
          {new Date(e.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">Courses</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
          Choose a course to start your learning journey.
        </p>
      </header>

      {error && <ErrorCard message={error} className="mb-4" />}
      {!profile && !loading && (
        <ErrorCard
          title="Profile required"
          message="Create your profile on the dashboard before applying for courses."
          className="mb-4"
        />
      )}

      <section>
        <h2 className="m-0 mb-3 font-serif text-lg font-semibold text-primary dark:text-gold">
          Available Courses
        </h2>
        {loading ? (
          <SkeletonLoader rows={2} height="h-40" />
        ) : courses.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No courses yet"
            description="New courses are added regularly. Please check back soon."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const details = COURSE_DETAILS[course.slug];
              const label = details?.label ?? course.name;
              const description = details?.description ?? course.description ?? '';
              const icon = details?.icon ?? '📖';
              const enrolled = enrolledCourseSlugs.has(course.slug);
              const myEnrollment = enrollments.find((e) => e.course?.slug === course.slug);
              const needsExam =
                myEnrollment?.status === 'ASSESSMENT_REQUIRED' && myEnrollment.assignedAssessment;

              return (
                <CourseCard
                  key={course.id}
                  title={label}
                  description={description}
                  icon={icon}
                  actionLabel={
                    needsExam ? 'Take Placement Exam' : enrolled ? undefined : 'Apply Now'
                  }
                  actionDisabled={applying === course.id || !profile}
                  onAction={() => {
                    if (needsExam && myEnrollment) {
                      router.push(examLink(myEnrollment.assignedAssessment!.id, myEnrollment.id));
                    } else {
                      void handleApply(course);
                    }
                  }}
                >
                  {myEnrollment && (
                    <div className="pt-1">
                      <StatusBadge status={myEnrollment.status} />
                    </div>
                  )}
                  {applying === course.id && (
                    <span className="text-xs text-slate-500 dark:text-gold-light/70">
                      Applying…
                    </span>
                  )}
                </CourseCard>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="m-0 mb-3 font-serif text-lg font-semibold text-primary dark:text-gold">
          My Enrollments
        </h2>
        {loading ? (
          <SkeletonLoader rows={3} height="h-12" />
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="No enrollments yet"
            description="Apply for a course above and your enrollment will appear here."
            action={
              <Link href="/dashboard/student">
                <Button variant="ghost" size="sm">
                  Go to dashboard
                </Button>
              </Link>
            }
          />
        ) : (
          <DataTable
            columns={enrollmentColumns}
            rows={enrollments}
            caption="My course enrollments"
            empty={<EmptyState title="No enrollments" description="Apply for a course to get started." />}
          />
        )}
      </section>
    </div>
  );
}
