'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import RequireRole from '@/components/RequireRole';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import ErrorCard from '@/components/feedback/ErrorCard';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import {
  apiErrorMessage,
  archiveAdminCourse,
  createAdminCourse,
  fetchAdminCourses,
  updateAdminCourse,
} from '@/lib/api';
import type { CourseItem, CourseStatus } from '@/lib/types';

type CourseForm = {
  name: string;
  slug: string;
  description: string;
  standardFee: string;
  status: CourseStatus;
};

const EMPTY_FORM: CourseForm = {
  name: '',
  slug: '',
  description: '',
  standardFee: '',
  status: 'DRAFT',
};

const COURSE_STATUSES: CourseStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export default function AdminCoursesPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminCourses />
    </RequireRole>
  );
}

function AdminCourses() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      setCourses(await fetchAdminCourses());
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load courses'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  function editCourse(course: CourseItem) {
    setEditingId(course.id);
    setForm({
      name: course.name,
      slug: course.slug,
      description: course.description ?? '',
      standardFee: course.standardFee === null ? '' : String(course.standardFee),
      status: course.status,
    });
    setNotice(null);
    document.getElementById('course-form')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setNotice(null);
  }

  async function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const fee = form.standardFee.trim() === '' ? null : Number(form.standardFee);
    if (fee !== null && (!Number.isInteger(fee) || fee < 0 || fee > 1_000_000)) {
      setError('Standard fee must be a whole number between 0 and 1,000,000.');
      setBusy(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      standardFee: fee,
      status: form.status,
    };

    try {
      if (editingId) {
        await updateAdminCourse(editingId, payload);
        setNotice('Course updated.');
      } else {
        await createAdminCourse(payload);
        setNotice('Course created.');
      }
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadCourses();
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not save course'));
    } finally {
      setBusy(false);
    }
  }

  async function archiveCourse(course: CourseItem) {
    if (
      !window.confirm(
        `Archive "${course.name}"? It will be hidden from students, but its enrollments and learning records will be kept.`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await archiveAdminCourse(course.id);
      setNotice(`${course.name} archived. You can restore it by editing its status.`);
      await loadCourses();
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not archive course'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/admin"
            className="text-sm font-medium text-teal hover:underline dark:text-gold"
          >
            ← Admin dashboard
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-bold text-primary dark:text-gold">
            Course Management
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Create and edit courses. Archiving hides a course without removing its student records.
          </p>
        </div>
      </header>

      {error && <ErrorCard message={error} />}
      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <Card>
        <h2 className="mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
          {editingId ? 'Edit course' : 'Create course'}
        </h2>
        <form id="course-form" className="grid gap-4 md:grid-cols-2" onSubmit={saveCourse}>
          <label className="space-y-1 text-sm font-medium">
            Course name
            <Input
              required
              minLength={2}
              maxLength={120}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Quran Reading"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            URL slug
            <Input
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Use lowercase letters, numbers, and single hyphens."
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="quran-reading"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Standard fee
            <Input
              type="number"
              min={0}
              max={1_000_000}
              step={1}
              value={form.standardFee}
              onChange={(event) => setForm({ ...form, standardFee: event.target.value })}
              placeholder="Optional"
            />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Visibility
            <Select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as CourseStatus })
              }
            >
              {COURSE_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-sm font-medium md:col-span-2">
            Description
            <Textarea
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Describe the course for students."
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create course'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" disabled={busy} onClick={resetForm}>
                Cancel edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      <section aria-labelledby="courses-heading" className="space-y-4">
        <h2 id="courses-heading" className="font-serif text-xl font-bold text-primary dark:text-gold">
          Courses ({courses.length})
        </h2>
        {loading ? (
          <SkeletonLoader rows={2} height="h-32" />
        ) : courses.length === 0 ? (
          <Card>
            <p className="m-0 text-sm text-slate-600 dark:text-gold-light/70">
              No courses yet. Create the first course using the form above.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
                      {course.name}
                    </h3>
                    <span className="rounded-full bg-sandstone/40 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-deep dark:text-gold">
                      {course.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-gold-light/60">/{course.slug}</p>
                  {course.description && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-gold-light/80">
                      {course.description}
                    </p>
                  )}
                  <p className="mt-3 text-sm text-slate-600 dark:text-gold-light/70">
                    Standard fee: {course.standardFee === null ? 'Not set' : course.standardFee}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => editCourse(course)}>
                    Edit
                  </Button>
                  {course.status !== 'ARCHIVED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => void archiveCourse(course)}
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
