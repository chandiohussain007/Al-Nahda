'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireRole from '@/components/RequireRole';
import {
  apiErrorMessage,
  apiStatus,
  createEnrollment,
  fetchEvaluationQuestions,
  fetchStudentProgress,
  fetchStudentProfile,
  fetchTeacherDirectory,
  saveStudentProfile,
  submitEvaluation,
} from '@/lib/api';
import {
  COURSES,
  LEVELS,
  type Course,
  type DirectoryTeacher,
  type EvaluationQuestion,
  type EvaluationTest,
  type Level,
  type StudentProgress,
  type StudentProfile,
} from '@/lib/types';

const TIMESLOT_OPTIONS = [
  { value: '', label: 'Any time (no filter)' },
  { value: 'MORNING', label: 'Morning (08:00 - 12:00)' },
  { value: 'AFTERNOON', label: 'Afternoon (12:00 - 16:00)' },
  { value: 'EVENING', label: 'Evening (16:00 - 20:00)' },
  { value: 'NIGHT', label: 'Night (20:00 - 24:00)' },
];

export default function StudentPage() {
  return (
    <RequireRole role="STUDENT">
      <StudentDashboard />
    </RequireRole>
  );
}

function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [directory, setDirectory] = useState<DirectoryTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bio, setBio] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const existing = await fetchStudentProfile();
      setProfile(existing);
      setFullName(existing.fullName);
      setWhatsappNumber(existing.whatsappNumber ?? '');
      setBio(existing.bio ?? '');
      setProgress(await fetchStudentProgress());
    } catch (e) {
      // 404 = no profile yet, which is the normal first-login state.
      if (apiStatus(e) !== 404) {
        setError(apiErrorMessage(e, 'Could not load your profile'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;

    fetchTeacherDirectory(timeSlot || undefined)
      .then((rows) => {
        if (!cancelled) setDirectory(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, 'Could not filter teachers'));
      });

    return () => {
      cancelled = true;
    };
  }, [timeSlot]);

  const submitProfile = async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const saved = await saveStudentProfile({
        fullName,
        whatsappNumber: whatsappNumber || undefined,
        bio: bio || undefined,
      });
      setProfile(saved);
      setNotice('Profile saved.');
      setProgress(await fetchStudentProgress());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not save the profile'));
    } finally {
      setBusy(false);
    }
  };

  // Evaluation test
  const [evalCourse, setEvalCourse] = useState<Course>('LEARN_QURAN');
  const [evalLevel, setEvalLevel] = useState<Level>('BEGINNER');
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evalResult, setEvalResult] = useState<EvaluationTest | null>(null);

  // Enrollment request
  const [teacherId, setTeacherId] = useState('');
  const [enrollCourse, setEnrollCourse] = useState<Course>('LEARN_QURAN');
  const [enrollLevel, setEnrollLevel] = useState<Level>('BEGINNER');

  const loadQuestions = async () => {
    setBusy(true);
    setError(null);
    setEvalResult(null);
    try {
      const rows = await fetchEvaluationQuestions(evalCourse, evalLevel);
      setQuestions(rows);
      setAnswers({});
      if (rows.length === 0) {
        setError('No questions are published for that course and level yet.');
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load questions'));
    } finally {
      setBusy(false);
    }
  };

  const sendEvaluation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (questions.some((q) => !answers[q.id])) {
      setError('Answer every question before submitting.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await submitEvaluation({
        course: evalCourse,
        claimedLevel: evalLevel,
        answers: questions.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
      });
      setEvalResult(result);
      // Preselect the awarded level so enrollment reuses the official result.
      setEnrollLevel(result.assignedLevel);
      setNotice(`Evaluation submitted: ${result.score}% (${result.status}).`);
      setProgress(await fetchStudentProgress());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not submit the evaluation'));
    } finally {
      setBusy(false);
    }
  };

  const sendEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId) {
      setError('Pick a teacher from the list.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createEnrollment({
        teacherId,
        courseName: enrollCourse,
        confirmedLevel: enrollLevel,
        preferredTimeSlot: timeSlot || 'Any time',
        // The backend derives `confirmedLevel` from this test when supplied.
        evaluationTestId: evalResult?.id,
      });
      setNotice('Enrollment request submitted ΓÇö waiting for approval.');
      setTimeSlot('');
      setProgress(await fetchStudentProgress());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not create the enrollment'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">LoadingΓÇª</p>;

  return (
    <>
      <h1>Student</h1>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="row">
            <h2>Profile</h2>
            <span className="spacer" />
            {profile && <span className="badge ok">created</span>}
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="s-fullName">Full name *</label>
              <input
                id="s-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aisha Rahman"
              />
            </div>
            <div>
              <label htmlFor="s-whatsapp">WhatsApp number</label>
              <input
                id="s-whatsapp"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+971500000000"
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="s-bio">Bio</label>
              <textarea id="s-bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
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
          <h2>Progress</h2>
          {!progress && <p className="muted">Create your profile to see progress.</p>}

          {progress && (
            <>
              <div className="field-row">
                <div>
                  <div className="muted">Attendance rate</div>
                  <div className="stat">{progress.attendance.attendanceRate}%</div>
                </div>
                <div>
                  <div className="muted">Sessions</div>
                  <div className="stat">{progress.attendance.totalSessions}</div>
                </div>
                <div>
                  <div className="muted">Active enrollments</div>
                  <div className="stat">{progress.activeEnrollments}</div>
                </div>
              </div>

              <p className="muted">
                Present {progress.attendance.PRESENT} ┬╖ Absent {progress.attendance.ABSENT} ┬╖
                Excused {progress.attendance.EXCUSED}
              </p>

              <h3>Latest evaluations</h3>
              {progress.latestEvaluations.length === 0 ? (
                <p className="muted">No evaluations yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Claimed</th>
                      <th>Assigned</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.latestEvaluations.map((t) => (
                      <tr key={t.id}>
                        <td>{t.claimedLevel}</td>
                        <td>{t.assignedLevel}</td>
                        <td>{t.score}%</td>
                        <td>
                          <span className={`badge ${t.status === 'PASSED' ? 'ok' : 'warn'}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={(e) => void sendEvaluation(e)}>
          <h2>Placement evaluation</h2>

          <div className="field-row">
            <div>
              <label htmlFor="eval-course">Course</label>
              <select
                id="eval-course"
                value={evalCourse}
                onChange={(e) => setEvalCourse(e.target.value as Course)}
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="eval-level">Claimed level</label>
              <select
                id="eval-level"
                value={evalLevel}
                onChange={(e) => setEvalLevel(e.target.value as Level)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" disabled={busy} onClick={() => void loadQuestions()}>
            Load questions
          </button>

          {questions.length > 0 && (
            <>
              <p className="muted">
                {questions.length} question{questions.length === 1 ? '' : 's'} ┬╖ answer all to
                submit
              </p>

              {questions.map((q, index) => (
                <fieldset
                  key={q.id}
                  style={{
                    border: '1px solid #e3e6ea',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 10,
                  }}
                >
                  <legend style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {index + 1}. {q.question}
                  </legend>
                  <div className="row">
                    {optionList(q.options).map((opt) => (
                      <label key={opt} className="row" style={{ margin: 0 }}>
                        <input
                          type="radio"
                          name={q.id}
                          style={{ width: 'auto' }}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        />{' '}
                        {opt}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              <button type="submit" className="primary" disabled={busy}>
                Submit evaluation
              </button>
            </>
          )}

          {evalResult && (
            <div className="notice" style={{ marginTop: 12 }}>
              Score {evalResult.score}% ΓåÆ assigned <strong>{evalResult.assignedLevel}</strong> (
              {evalResult.status})
            </div>
          )}
        </form>

        <form className="card" onSubmit={(e) => void sendEnrollment(e)}>
          <h2>Request enrollment</h2>

          <div className="field-row">
            <div>
              <label htmlFor="enr-teacher">Teacher</label>
              <select
                id="enr-teacher"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                disabled={directory.length === 0}
              >
                <option value="">
                  {directory.length === 0 ? 'No approved teachers yet' : 'SelectΓÇª'}
                </option>
                {directory.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ΓÇö {t.subjectsTaught.join(', ') || 'general'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enr-course">Course</label>
              <select
                id="enr-course"
                value={enrollCourse}
                onChange={(e) => setEnrollCourse(e.target.value as Course)}
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enr-level">Level</label>
              <select
                id="enr-level"
                value={enrollLevel}
                onChange={(e) => setEnrollLevel(e.target.value as Level)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {evalResult && (
                <p className="muted" style={{ marginTop: 4 }}>
                  Using evaluation result: {evalResult.assignedLevel} ({evalResult.score}%)
                </p>
              )}
            </div>
          </div>

          <div className="field-row">
            <div>
              <label htmlFor="enr-slot">Preferred time slot</label>
              <select
                id="enr-slot"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                {TIMESLOT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="primary"
            disabled={busy || !teacherId}
          >
            Submit request
          </button>
          <p className="muted">An admin activates the enrollment after review.</p>
        </form>
      </div>
    </>
  );
}

/** The API stores `options` as JSON ΓÇö accept an array or an object map. */
function optionList(options: unknown): string[] {
  if (Array.isArray(options)) return options.map((option) => String(option));
  if (options && typeof options === 'object') {
    return Object.values(options as Record<string, unknown>).map((option) => String(option));
  }
  return [];
}
