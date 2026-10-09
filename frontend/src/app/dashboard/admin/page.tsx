'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import StatCard from '@/components/data-display/StatCard';
import StatusBadge from '@/components/data-display/StatusBadge';
import DataTable, { type Column } from '@/components/data-display/DataTable';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import { useToast } from '@/components/feedback/Toast';
import { LayoutDashboard, Users, GraduationCap, ClipboardList, BookOpen, Settings } from 'lucide-react';
import {
  apiErrorMessage,
  approveTeacher,
  clearProfilePicture,
  clearTeacherCv,
  fetchAdminEnrollments,
  fetchAdminStudents,
  fetchAdminTeachers,
  rejectTeacher,
  setAdminUserActive,
  setProfilePicture,
  setTeacherCv,
} from '@/lib/api';
import {
  TEACHER_STATUSES,
  type Enrollment,
  type StudentProfile,
  type TeacherProfile,
  type TeacherStatus,
} from '@/lib/types';

type TabKey = 'overview' | 'teachers' | 'students';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'teachers', label: 'Teachers', icon: <Users className="h-4 w-4" /> },
  { key: 'students', label: 'Students', icon: <GraduationCap className="h-4 w-4" /> },
];

export default function AdminPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminDashboard />
    </RequireRole>
  );
}

function AdminDashboard() {
  const { toast: showToast } = useToast();
  const [tab, setTab] = useState<TabKey>('overview');

  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [teacherFilter, setTeacherFilter] = useState<TeacherStatus | ''>('');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherRows, studentRows, enrollmentRows] = await Promise.all([
        fetchAdminTeachers(teacherFilter || undefined),
        fetchAdminStudents(),
        fetchAdminEnrollments(),
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
  }, [teacherFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (message: string, run: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await run();
      showToast(message, 'success');
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

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

  async function changeAccountStatus(
    userId: string | undefined,
    name: string,
    isActive: boolean,
  ) {
    if (!userId) return;
    const action = isActive ? 'restore' : 'deactivate';
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${name}'s account? ${
          isActive ? '' : 'Their data will be preserved, but they will lose access.'
        }`,
      )
    ) {
      return;
    }

    await act(
      isActive ? 'Account restored.' : 'Account deactivated.',
      () => setAdminUserActive(userId, isActive),
    );
  }

  if (loading && tab === 'overview') {
    return (
      <div className="space-y-6">
        <SkeletonLoader rows={1} height="h-10" />
        <SkeletonLoader rows={2} height="h-32" />
      </div>
    );
  }

  const pendingTeachersCount = teachers.filter(t => t.teacherStatus === 'PENDING').length;

  const teacherColumns: Column<TeacherProfile>[] = [
    { key: 'name', header: 'Name', render: (t) => <div className="font-medium text-primary dark:text-ivory">{t.fullName}</div> },
    { key: 'email', header: 'Email', render: (t) => <div className="text-sm text-slate-500">{t.user?.email ?? '—'}</div> },
    { key: 'account', header: 'Account', render: (t) => <span className={t.user?.isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{t.user?.isActive ? 'Active' : 'Deactivated'}</span> },
    { key: 'phone', header: 'Phone', secondary: true, render: (t) => t.phoneNumber ?? '—' },
    { key: 'subjects', header: 'Subjects', secondary: true, render: (t) => t.subjectsTaught.join(', ') || '—' },
    { key: 'exp', header: 'Experience', secondary: true, render: (t) => `${t.experienceYears} yrs` },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.teacherStatus ?? 'PENDING'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (t) => (
        <div className="flex flex-wrap gap-2">
          {t.teacherStatus === 'PENDING' && (
            <>
              <Button
                size="sm"
                variant="primary"
                disabled={busy}
                onClick={() => void act('Teacher approved.', () => approveTeacher(t.id))}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => void act('Teacher rejected.', () => rejectTeacher(t.id))}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !t.userId}
            onClick={() => void changePicture(t.userId, t.fullName)}
          >
            Pic
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !t.userId}
            onClick={() => void changeCv(t.userId, t.fullName)}
          >
            CV
          </Button>
          <Button
            size="sm"
            variant={t.user?.isActive ? 'danger' : 'secondary'}
            disabled={busy || !t.userId}
            onClick={() =>
              void changeAccountStatus(t.userId, t.fullName, !t.user?.isActive)
            }
          >
            {t.user?.isActive ? 'Deactivate' : 'Restore'}
          </Button>
        </div>
      )
    }
  ];

  const studentColumns: Column<StudentProfile>[] = [
    { key: 'name', header: 'Name', render: (s) => <div className="font-medium text-primary dark:text-ivory">{s.fullName}</div> },
    { key: 'email', header: 'Email', render: (s) => <div className="text-sm text-slate-500">{s.user?.email ?? '—'}</div> },
    { key: 'account', header: 'Account', render: (s) => <span className={s.user?.isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{s.user?.isActive ? 'Active' : 'Deactivated'}</span> },
    { key: 'joined', header: 'Joined', secondary: true, render: (s) => new Date(s.user?.createdAt ?? '').toLocaleDateString() },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/admin/students/${s.id}`}>
            <Button size="sm" variant="secondary">View</Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !s.userId}
            onClick={() => void changePicture(s.userId, s.fullName)}
          >
            Picture
          </Button>
          <Button
            size="sm"
            variant={s.user?.isActive ? 'danger' : 'secondary'}
            disabled={busy || !s.userId}
            onClick={() =>
              void changeAccountStatus(s.userId, s.fullName, !s.user?.isActive)
            }
          >
            {s.user?.isActive ? 'Deactivate' : 'Restore'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Platform overview and user management.
          </p>
        </div>
      </header>

      {error && <ErrorCard message={error} />}

      <div className="flex space-x-1 overflow-x-auto rounded-xl bg-sandstone/20 p-1 dark:bg-primary/30">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-teal shadow-sm dark:bg-teal dark:text-white'
                : 'text-slate-600 hover:bg-white/50 hover:text-charcoal dark:text-gold-light/70 dark:hover:bg-primary/60 dark:hover:text-gold'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Students"
                value={students.length}
                caption="Registered student profiles"
              />
              <StatCard
                label="Total Teachers"
                value={teachers.length}
                caption="Approved and active instructors"
              />
              <StatCard
                label="Pending Teachers"
                value={pendingTeachersCount}
                caption="Waiting for approval"
              />
              <StatCard
                label="Legacy Enrollments"
                value={enrollments.length}
                caption="From old enrollment system"
              />
            </section>

            <section>
              <h2 className="mb-4 font-serif text-xl font-bold text-primary dark:text-gold">
                Quick Actions & Navigation
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="flex flex-col justify-between hover:border-teal transition-colors">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-primary dark:text-gold">
                      <BookOpen className="h-5 w-5" /> Courses
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/70">
                      Create courses, update their details, and publish or archive them.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/admin/courses">
                      <Button variant="secondary" className="w-full">Manage Courses</Button>
                    </Link>
                  </div>
                </Card>

                <Card className="flex flex-col justify-between hover:border-teal transition-colors">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-primary dark:text-gold">
                      <ClipboardList className="h-5 w-5" /> Enrollments
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/70">
                      Manage student enrollments, assign exams, and approve applications.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/admin/enrollments">
                      <Button variant="secondary" className="w-full">Manage Enrollments</Button>
                    </Link>
                  </div>
                </Card>

                <Card className="flex flex-col justify-between hover:border-teal transition-colors">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-primary dark:text-gold">
                      <BookOpen className="h-5 w-5" /> Question Bank
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/70">
                      Create and manage questions for placement exams and assessments.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/admin/questions">
                      <Button variant="secondary" className="w-full">Manage Questions</Button>
                    </Link>
                  </div>
                </Card>

                <Card className="flex flex-col justify-between hover:border-teal transition-colors">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-primary dark:text-gold">
                      <Settings className="h-5 w-5" /> Assessments
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-gold-light/70">
                      Build assessments using the question bank.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/admin/assessments">
                      <Button variant="secondary" className="w-full">Manage Assessments</Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        )}

        {tab === 'teachers' && (
          <Card>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
                  Teachers
                </h2>
                <p className="mt-1 text-sm text-slate-500">Manage instructor profiles and approvals.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-gold-light/70">Filter:</span>
                <Select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value as TeacherStatus | '')}
                >
                  <option value="">All Statuses</option>
                  {TEACHER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <DataTable
              columns={teacherColumns}
              rows={teachers}
              empty={<EmptyState title="No teachers found" description="No teachers match the current filter." />}
            />
          </Card>
        )}

        {tab === 'students' && (
          <Card>
            <div className="mb-4">
              <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
                Students
              </h2>
              <p className="mt-1 text-sm text-slate-500">View and manage student profiles.</p>
            </div>

            <DataTable
              columns={studentColumns}
              rows={students}
              empty={<EmptyState title="No students" description="No students have registered yet." />}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
