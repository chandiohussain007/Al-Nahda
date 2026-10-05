'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
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

const SUBJECT_OPTIONS = [
  { value: 'LEARN_QURAN', label: 'Quran' },
  { value: 'LEARN_ARABIC', label: 'Arabic' },
];

export default function TeacherPage() {
  return (
    <RequireRole role="TEACHER">
      <TeacherDashboard />
    </RequireRole>
  );
}

function TeacherDashboard() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('0');
  const [subjects, setSubjects] = useState<string[]>([]);

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
      setEnrollments(await fetchMyEnrollments());
    } catch (e) {
      // 404 = no profile created yet, a normal first-login state.
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

  const submitProfile = async () => {
    setBusy(true);
    setNotice(null);
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
      });
      setProfile(saved);
      setNotice(
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

  // Show what has already been recorded for the selected enrollment.
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
    setNotice(null);
    setError(null);
    try {
      await recordAttendance({
        enrollmentId: attendanceEnrollmentId,
        date: new Date(attendanceDate).toISOString(),
        status: attendanceStatus,
      });
      setNotice('Attendance recorded.');
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
    setNotice(null);
    setError(null);
    try {
      await sendTeacherNotification(recipientId.trim(), message.trim());
      setNotice('Notification sent.');
      setMessage('');
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not send the notification'));
    } finally {
      setBusy(false);
    }
  };

  const resolveEnrollment = async (id: string, action: 'accept' | 'reject') => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      if (action === 'accept') {
        await teacherAcceptEnrollment(id);
        setNotice('Enrollment accepted — the student has been notified.');
      } else {
        await teacherRejectEnrollment(id);
        setNotice('Enrollment rejected — the student has been notified.');
      }
      setEnrollments(await fetchMyEnrollments());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not update the enrollment'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <>
      <h1>Teacher</h1>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="card">
        <div className="row">
          <h2>Profile</h2>
          <span className="spacer" />
          {profile?.teacherStatus && (
            <span
              className={`badge ${
                profile.teacherStatus === 'APPROVED'
                  ? 'ok'
                  : profile.teacherStatus === 'PENDING'
                    ? 'warn'
                    : 'err'
              }`}
            >
              {profile.teacherStatus}
            </span>
          )}
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="fullName">Full name *</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sheikh Yusuf Ali"
            />
          </div>
          <div>
            <label htmlFor="experience">Experience (years)</label>
            <input
              id="experience"
              type="number"
              min={0}
              max={80}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
            />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="qualifications">Qualifications (comma separated)</label>
            <input
              id="qualifications"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="Ijazah in Hafs"
            />
          </div>
          <div>
            <label>Subjects taught</label>
            <div className="row">
              {SUBJECT_OPTIONS.map((opt) => (
                <label key={opt.value} className="row" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    checked={subjects.includes(opt.value)}
                    onChange={() => toggleSubject(opt.value)}
                  />{' '}
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          className="primary"
          disabled={busy || !fullName}
          onClick={() => void submitProfile()}
        >
          {profile ? 'Save profile' : 'Create profile'}
        </button>
      </div>

      <div className="card">
        <h2>My enrollments ({enrollments.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Student</th>
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
                <td>{e.courseName}</td>
                <td>{e.confirmedLevel}</td>
                <td>{e.preferredTimeSlot}</td>
                <td>
                  <span
                    className={`badge ${
                      e.status === 'ACTIVE' ? 'ok' : e.status === 'PENDING' ? 'warn' : ''
                    }`}
                  >
                    {e.status}
                  </span>
                </td>
                <td>
                  {e.status === 'PENDING' ? (
                    <div className="row">
                      <button
                        type="button"
                        className="success"
                        disabled={busy}
                        onClick={() => void resolveEnrollment(e.id, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={busy}
                        onClick={() => void resolveEnrollment(e.id, 'reject')}
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
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No enrollments yet. Students appear here once they request a class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={(e) => void submitAttendance(e)}>
          <h2>Record attendance</h2>

          <div className="field-row">
            <div>
              <label htmlFor="att-enrollment">Enrollment</label>
              <select
                id="att-enrollment"
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
              </select>
            </div>

            <div>
              <label htmlFor="att-date">Date</label>
              <input
                id="att-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="att-status">Status</label>
              <select
                id="att-status"
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as typeof attendanceStatus)}
              >
                {(['PRESENT', 'ABSENT', 'EXCUSED'] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={busy || !attendanceEnrollmentId || !attendanceDate}
          >
            Record attendance
          </button>
          <p className="muted">Approved teachers only — the API enforces this.</p>

          {attendanceEnrollmentId && (
            <>
              <h3 style={{ marginTop: 16 }}>Attendance history</h3>
              {attendanceRecords.length === 0 ? (
                <p className="muted">No records for this enrollment yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === 'PRESENT'
                                ? 'ok'
                                : record.status === 'ABSENT'
                                  ? 'err'
                                  : 'warn'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </form>

        <form className="card" onSubmit={(e) => void submitNotification(e)}>
          <h2>Send a notification</h2>

          <div className="field-row">
            <div>
              <label htmlFor="recipient">Recipient user id</label>
              <input
                id="recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="uuid of the user to notify"
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="msg">Message</label>
              <textarea
                id="msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Class moved to 6pm tomorrow."
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={busy || !recipientId.trim() || !message.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}
