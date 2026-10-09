'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles } from 'lucide-react';
import RequireRole from '@/components/RequireRole';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import StatCard from '@/components/data-display/StatCard';
import ProgressRing from '@/components/data-display/ProgressRing';
import StatusBadge from '@/components/data-display/StatusBadge';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import { useToast } from '@/components/feedback/Toast';
import {
  apiErrorMessage,
  apiStatus,
  fetchEvaluationQuestions,
  fetchStudentProgress,
  fetchStudentProfile,
  saveStudentProfile,
  submitEvaluation,
} from '@/lib/api';
import {
  COURSES,
  LEVELS,
  type Course,
  type EvaluationQuestion,
  type EvaluationTest,
  type Level,
  type StudentProgress,
  type StudentProfile,
} from '@/lib/types';

export default function StudentPage() {
  return (
    <RequireRole role="STUDENT">
      <StudentDashboard />
    </RequireRole>
  );
}

function StudentDashboard() {
  const router = useRouter();
  const { toast: showToast } = useToast();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile form
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [bio, setBio] = useState('');

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

  const submitProfile = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await saveStudentProfile({
        fullName,
        whatsappNumber: whatsappNumber || undefined,
        bio: bio || undefined,
      });
      setProfile(saved);
      showToast('Profile saved.');
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
      showToast(`Evaluation submitted: ${result.score}% (${result.status}).`);
      setProgress(await fetchStudentProgress());
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not submit the evaluation'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
          Student dashboard
        </h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <SkeletonLoader rows={2} height="h-20" />
          <SkeletonLoader rows={2} height="h-20" />
          <SkeletonLoader rows={2} height="h-20" />
        </div>
        <SkeletonLoader rows={4} height="h-24" />
      </div>
    );
  }

  const attendance = progress?.attendance;
  const hasProgress = Boolean(progress);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
          Student dashboard
        </h1>
        <p className="m-0 text-sm text-slate-500 dark:text-gold-light/70">
          Track your learning, keep your profile current, and take placement evaluations.
        </p>
      </header>

      {error && <ErrorCard message={error} className="mb-2" />}

      {/* Stat overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Attendance rate"
          value={`${attendance?.attendanceRate ?? 0}%`}
          caption="Across all sessions"
        />
        <StatCard
          label="Active enrollments"
          value={progress?.activeEnrollments ?? 0}
          caption={progress ? `${progress.totalEnrollments} total` : 'Create a profile to begin'}
        />
        <StatCard
          label="Sessions"
          value={attendance?.totalSessions ?? 0}
          caption="Present + absent + excused"
        />
        <StatCard
          label="Evaluations"
          value={progress?.latestEvaluations.length ?? 0}
          caption="Placement tests taken"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
              Profile
            </h2>
            {profile && <StatusBadge status="APPROVED" />}
          </div>

          <div className="space-y-4">
            <FormField label="Full name">
              {(p) => (
                <Input
                  {...p}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aisha Rahman"
                />
              )}
            </FormField>
            <FormField label="WhatsApp number" hint="Used for class reminders only.">
              {(p) => (
                <Input
                  {...p}
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+971500000000"
                />
              )}
            </FormField>
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
            <Button
              variant="primary"
              disabled={busy || !fullName}
              onClick={() => void submitProfile()}
            >
              {profile ? 'Save profile' : 'Create profile'}
            </Button>
          </div>
        </Card>

        {/* Progress */}
        <Card>
          <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
            Progress
          </h2>

          {!hasProgress ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No progress yet"
              description="Create your profile above to start tracking attendance and evaluations."
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <ProgressRing
                  value={attendance?.attendanceRate ?? 0}
                  label="Attendance rate"
                />
                <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-slate-500 dark:text-gold-light/70">Present</div>
                    <div className="font-serif text-xl font-bold text-primary dark:text-gold">
                      {attendance?.PRESENT ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-gold-light/70">Absent</div>
                    <div className="font-serif text-xl font-bold text-primary dark:text-gold">
                      {attendance?.ABSENT ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-gold-light/70">Excused</div>
                    <div className="font-serif text-xl font-bold text-primary dark:text-gold">
                      {attendance?.EXCUSED ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="m-0 mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gold-light/70">
                  Latest evaluations
                </h3>
                {progress!.latestEvaluations.length === 0 ? (
                  <p className="m-0 text-sm text-slate-500 dark:text-gold-light/70">
                    No evaluations yet.
                  </p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {progress!.latestEvaluations.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center justify-between rounded-md border border-sandstone/60 px-3 py-2 text-sm dark:border-gold/20"
                      >
                        <span className="text-charcoal dark:text-ivory">
                          {t.claimedLevel} → {t.assignedLevel}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-gold-light/70">
                            {t.score}%
                          </span>
                          <StatusBadge status={t.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Placement evaluation */}
        <Card>
          <div className="mb-1 flex items-center gap-2 text-gold">
            <Sparkles className="h-4 w-4" />
            <h2 className="m-0 font-serif text-lg font-semibold text-primary dark:text-gold">
              Placement evaluation
            </h2>
          </div>
          <p className="m-0 mb-4 text-sm text-slate-500 dark:text-gold-light/70">
            Take a short test so we can place you at the right level.
          </p>

          <form onSubmit={(e) => void sendEvaluation(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Course">
                {(p) => (
                  <Select
                    {...p}
                    value={evalCourse}
                    onChange={(e) => setEvalCourse(e.target.value as Course)}
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Claimed level">
                {(p) => (
                  <Select
                    {...p}
                    value={evalLevel}
                    onChange={(e) => setEvalLevel(e.target.value as Level)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <Button variant="secondary" disabled={busy} onClick={() => void loadQuestions()}>
              Load questions
            </Button>

            {questions.length > 0 && (
              <>
                <p className="m-0 text-xs text-slate-500 dark:text-gold-light/70">
                  {questions.length} question{questions.length === 1 ? '' : 's'} - answer all to
                  submit
                </p>

                <div className="flex flex-col gap-4">
                  {questions.map((q, index) => (
                    <fieldset
                      key={q.id}
                      className="rounded-lg border border-sandstone px-3 py-2 dark:border-gold/25"
                    >
                      <legend className="px-1 text-sm font-semibold text-charcoal dark:text-ivory">
                        {index + 1}. {q.question}
                      </legend>
                      <div className="flex flex-col gap-1.5">
                        {optionList(q.options).map((opt) => (
                          <label
                            key={opt}
                            className="flex cursor-pointer items-center gap-2 text-sm text-charcoal dark:text-ivory"
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={answers[q.id] === opt}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>

                <Button type="submit" variant="primary" disabled={busy || !profile}>
                  Submit evaluation
                </Button>
                {!profile && (
                  <p className="m-0 text-xs text-slate-500 dark:text-gold-light/70">
                    Create your profile to submit an evaluation.
                  </p>
                )}
              </>
            )}

            {evalResult && (
              <div className="rounded-md border border-teal/40 bg-teal/10 px-3 py-2 text-sm text-charcoal dark:text-ivory">
                Score {evalResult.score}% - assigned{' '}
                <strong>{evalResult.assignedLevel}</strong> ({evalResult.status})
              </div>
            )}
          </form>
        </Card>

        {/* Request enrollment */}
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="m-0 mb-2 font-serif text-lg font-semibold text-primary dark:text-gold">
              Request enrollment
            </h2>
            <p className="m-0 text-sm text-slate-500 dark:text-gold-light/70">
              Browse our courses and apply to join a class with a qualified instructor.
            </p>
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => router.push('/dashboard/student/courses')}>
              Browse Courses →
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** The API stores `options` as JSON - accept an array or an object map. */
function optionList(options: unknown): string[] {
  if (Array.isArray(options)) return options.map((option) => String(option));
  if (options && typeof options === 'object') {
    return Object.values(options as Record<string, unknown>).map((option) => String(option));
  }
  return [];
}