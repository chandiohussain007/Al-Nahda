'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import StatCard from '@/components/data-display/StatCard';
import StatusBadge from '@/components/data-display/StatusBadge';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import DataTable, { type Column } from '@/components/data-display/DataTable';
import { useToast } from '@/components/feedback/Toast';
import {
  apiErrorMessage,
  apiStatus,
  fetchAttendance,
  fetchMyEnrollments,
  fetchTeacherProfile,
  recordAttendance,
  saveTeacherProfile,
  sendTeacherNotification,
  teacherAcceptEnrollment,
  teacherRejectEnrollment,
} from '@/lib/api';
import type { AttendanceRecord, Enrollment, TeacherProfile } from '@/lib/types';
import { CalendarCheck, BookOpen, Bell, UserRound, LayoutDashboard } from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: 'LEARN_QURAN', label: 'Quran' },
  { value: 'LEARN_ARABIC', label: 'Arabic' },
];

const TIMESLOT_OPTIONS = [
  { value: 'MORNING', label: 'Morning (08:00 - 12:00)' },
  { value: 'AFTERNOON', label: 'Afternoon (12:00 - 16:00)' },
  { value: 'EVENING', label: 'Evening (16:00 - 20:00)' },
  { value: 'NIGHT', label: 'Night (20:00 - 24:00)' },
];

type TabKey = 'overview' | 'profile' | 'enrollments' | 'attendance' | 'notify';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: 'profile', label: 'Profile', icon: <UserRound className="h-4 w-4" /> },
  { key: 'enrollments', label: 'Enrollments', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'attendance', label: 'Attendance', icon: <CalendarCheck className="h-4 w-4" /> },
  { key: 'notify', label: 'Notify', icon: <Bell className="h-4 w-4" /> },
];

export default function TeacherPage() {
  return (
    <RequireRole role="TEACHER">
      <TeacherDashboard />
    </RequireRole>
  );
}

function TeacherDashboard() {
  const { toast: showToast } = useToast();
  const [tab, setTab] = useState<TabKey>('overview');
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await fetchTeacherProfile();
      setProfile(existing);
      setFullName(existing.fullName);
      setBio(existing.bio ?? '');
      setQualifications(existing.qualifications.join(', '));
      setExperienceYears(String(existing.experienceYears));
      setSubjects(existing.subjectsTaught);
      setPhoneNumber(existing.phoneNumber ?? '');
      setCvUrl(existing.cvUrl ?? '');
      setTimeSlots(existing.availableTimeSlots ?? []);
      setEnrollments(await fetchMyEnrollments());
    } catch (e) {
      if (apiStatus(e) !== 404) {
        setError(apiErrorMessage(e, 'Could not load your teacher profile'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleSubject = (value: string) =>
    setSubjects((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );

  const toggleTimeSlot = (value: string) =>
    setTimeSlots((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );

  const submitProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await saveTeacherProfile({
        fullName,
        bio: bio || undefined,
        qualifications: qualifications
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean),
        experienceYears: Number(experienceYears) || 0,
        subjectsTaught: subjects,
        phoneNumber: phoneNumber.trim() || null,
        cvUrl: cvUrl.trim() || null,
        availableTimeSlots: timeSlots,
      });
      setProfile(saved);
      showToast(
        saved.teacherStatus === 'PENDING'
          ? 'Profile saved. Your application is waiting for admin approval.'
          : 'Profile saved.',
      );
      setEnrollments(await fetchMyEnrollments());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not save the profile'));
    } finally {
      setBusy(false);
    }
  };

  // Attendance form
  const [attendanceEnrollmentId, setAttendanceEnrollmentId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState<'PRESENT' | 'ABSENT' | 'EXCUSED'>(
    'PRESENT',
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!attendanceEnrollmentId) {
      setAttendanceRecords([]);
      return;
    }

    let cancelled = false;

    fetchAttendance(attendanceEnrollmentId)
      .then((rows) => {
        if (!cancelled) setAttendanceRecords(rows);
      })
      .catch(() => {
        if (!cancelled) setAttendanceRecords([]);
      });

    return () => {
      cancelled = true;
    };
  }, [attendanceEnrollmentId]);

  // Notification form
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');

  const submitAttendance = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await recordAttendance({
        enrollmentId: attendanceEnrollmentId,
        date: new Date(attendanceDate).toISOString(),
        status: attendanceStatus,
      });
      showToast('Attendance recorded.', 'success');
      setAttendanceRecords(await fetchAttendance(attendanceEnrollmentId));
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not record attendance'));
    } finally {
      setBusy(false);
    }
  };

  const submitNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendTeacherNotification(recipientId.trim(), message.trim());
      showToast('Notification sent.', 'success');
      setMessage('');
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not send the notification'));
    } finally {
      setBusy(false);
    }
  };

  const resolveEnrollment = async (id: string, action: 'accept' | 'reject') => {
    setBusy(true);
    setError(null);
    try {
      if (action === 'accept') {
        await teacherAcceptEnrollment(id);
        showToast('Enrollment accepted — the student has been notified.', 'success');
      } else {
        await teacherRejectEnrollment(id);
        showToast('Enrollment rejected — the student has been notified.', 'info');
      }
      setEnrollments(await fetchMyEnrollments());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not update the enrollment'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader rows={1} height="h-10" />
        <SkeletonLoader rows={1} height="h-12" />
        <SkeletonLoader rows={4} height="h-40" />
      </div>
    );
  }

  const activeEnrollmentsCount = enrollments.filter(e => e.status === 'ACTIVE').length;
  const pendingEnrollmentsCount = enrollments.filter(e => e.status === 'PENDING').length;

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'student', header: 'Student', render: (e) => e.student?.fullName ?? e.studentId },
    { key: 'course', header: 'Course', render: (e) => e.courseName },
    { key: 'level', header: 'Level', secondary: true, render: (e) => e.confirmedLevel },
    { key: 'slot', header: 'Time Slot', secondary: true, render: (e) => e.preferredTimeSlot },
    { key: 'status', header: 'Status', render: (e) => <StatusBadge status={e.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (e) => {
        if (e.status !== 'PENDING') return <span className="text-slate-400">—</span>;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={busy}
              onClick={() => void resolveEnrollment(e.id, 'accept')}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => void resolveEnrollment(e.id, 'reject')}
            >
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  const attendanceColumns: Column<AttendanceRecord>[] = [
    { key: 'date', header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
            Teacher Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Manage your profile, classes, and student attendance.
          </p>
        </div>
        {profile?.teacherStatus && (
          <StatusBadge status={profile.teacherStatus} />
        )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Enrollments"
              value={activeEnrollmentsCount}
              caption="Students currently taking your classes"
            />
            <StatCard
              label="Pending Requests"
              value={pendingEnrollmentsCount}
              caption="Enrollments needing your approval"
            />
            <StatCard
              label="Experience"
              value={`${experienceYears} yrs`}
              caption="Teaching experience"
            />
            <StatCard
              label="Status"
              value={profile ? profile.teacherStatus : 'No Profile'}
              caption="Admin approval state"
            />
          </div>
        )}

        {tab === 'profile' && (
          <Card>
            <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
              Teacher Profile
            </h2>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" hint="Required">
                  {(p) => (
                    <Input
                      {...p}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Sheikh Yusuf Ali"
                    />
                  )}
                </FormField>
                <FormField label="Experience (years)">
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={0}
                      max={80}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  )}
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Qualifications (comma separated)">
                  {(p) => (
                    <Input
                      {...p}
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="Ijazah in Hafs"
                    />
                  )}
                </FormField>
                <FormField label="Phone (Admins only)">
                  {(p) => (
                    <Input
                      {...p}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+92 300 1234567"
                    />
                  )}
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Subjects taught">
                  {() => (
                    <div className="flex flex-wrap gap-4">
                      {SUBJECT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm text-charcoal dark:text-ivory">
                          <input
                            type="checkbox"
                            checked={subjects.includes(opt.value)}
                            onChange={() => toggleSubject(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                </FormField>
                <FormField label="Available time slots">
                  {() => (
                    <div className="flex flex-col gap-2">
                      {TIMESLOT_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 text-sm text-charcoal dark:text-ivory">
                          <input
                            type="checkbox"
                            checked={timeSlots.includes(opt.value)}
                            onChange={() => toggleTimeSlot(opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                </FormField>
              </div>

              <FormField label="Bio">
                {(p) => (
                  <Textarea
                    {...p}
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                )}
              </FormField>

              <FormField label="CV / Certificate Link">
                {(p) => (
                  <Input
                    {...p}
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    placeholder="https://example.com/cv.pdf"
                  />
                )}
              </FormField>

              <Button
                variant="primary"
                disabled={busy || !fullName}
                onClick={() => void submitProfile()}
              >
                {profile ? 'Save Profile' : 'Create Profile'}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'enrollments' && (
          <Card>
            <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
              My Enrollments
            </h2>
            <DataTable
              columns={enrollmentColumns}
              rows={enrollments}
              empty={<EmptyState title="No enrollments" description="Students appear here once they request a class." />}
            />
          </Card>
        )}

        {tab === 'attendance' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
                Record Attendance
              </h2>
              <form onSubmit={(e) => void submitAttendance(e)} className="space-y-4">
                <FormField label="Enrollment">
                  {(p) => (
                    <Select
                      {...p}
                      value={attendanceEnrollmentId}
                      onChange={(e) => setAttendanceEnrollmentId(e.target.value)}
                      disabled={enrollments.length === 0}
                    >
                      <option value="">
                        {enrollments.length === 0 ? 'No enrollments yet' : 'Select…'}
                      </option>
                      {enrollments.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.student?.fullName ?? e.studentId} — {e.courseName} ({e.status})
                        </option>
                      ))}
                    </Select>
                  )}
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Date">
                    {(p) => (
                      <Input
                        {...p}
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                      />
                    )}
                  </FormField>
                  <FormField label="Status">
                    {(p) => (
                      <Select
                        {...p}
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value as typeof attendanceStatus)}
                      >
                        {(['PRESENT', 'ABSENT', 'EXCUSED'] as const).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    )}
                  </FormField>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={busy || !attendanceEnrollmentId || !attendanceDate}
                >
                  Record Attendance
                </Button>
                <p className="mt-2 text-xs text-slate-500 dark:text-gold-light/70">
                  Approved teachers only — the API enforces this.
                </p>
              </form>
            </Card>

            {attendanceEnrollmentId && (
              <Card>
                <h3 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
                  Attendance History
                </h3>
                <DataTable
                  columns={attendanceColumns}
                  rows={attendanceRecords}
                  empty={<EmptyState title="No records" description="No attendance recorded for this enrollment yet." />}
                />
              </Card>
            )}
          </div>
        )}

        {tab === 'notify' && (
          <Card>
            <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
              Send a Notification
            </h2>
            <form onSubmit={(e) => void submitNotification(e)} className="space-y-4 max-w-xl">
              <FormField label="Recipient User ID">
                {(p) => (
                  <Input
                    {...p}
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    placeholder="uuid of the user to notify"
                  />
                )}
              </FormField>

              <FormField label="Message">
                {(p) => (
                  <Textarea
                    {...p}
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Class moved to 6pm tomorrow."
                  />
                )}
              </FormField>

              <Button
                type="submit"
                variant="primary"
                disabled={busy || !recipientId.trim() || !message.trim() || !profile}
              >
                Send Notification
              </Button>
              {!profile && (
                <p className="mt-2 text-xs text-slate-500 dark:text-gold-light/70">
                  Create your profile to send notifications.
                </p>
              )}
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
