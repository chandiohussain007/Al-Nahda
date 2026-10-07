'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  apiErrorMessage,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from '@/lib/api';
import type { AttemptResult, ExamQuestion, StartAttemptResponse } from '@/lib/types';

type Phase = 'loading' | 'exam' | 'submitting' | 'result' | 'error';

export default function ExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const enrollmentId = searchParams.get('enrollmentId') ?? undefined;

  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState<StartAttemptResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptIdRef = useRef<string>('');

  // ── Start the attempt on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!assessmentId) {
      setError('No assessment ID provided.');
      setPhase('error');
      return;
    }

    startAttempt({ assessmentId, enrollmentId })
      .then((res) => {
        setAttempt(res);
        attemptIdRef.current = res.attemptId;
        setTimeLeft(res.durationMinutes * 60);
        setPhase('exam');
      })
      .catch((err) => {
        setError(apiErrorMessage(err));
        setPhase('error');
      });
  }, [assessmentId, enrollmentId]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Save answer to server (debounced per question) ──────────────────────
  const persistAnswer = useCallback(
    async (questionId: string, selectedOptionId: string | null) => {
      setSaving(questionId);
      try {
        await saveAnswer(attemptIdRef.current, { questionId, selectedOptionId });
      } catch {
        // Non-critical — student can still submit; we warn but don't block
      } finally {
        setSaving(null);
      }
    },
    [],
  );

  function selectOption(question: ExamQuestion, optionId: string) {
    const next = answers[question.id] === optionId ? null : optionId;
    setAnswers((prev) => ({ ...prev, [question.id]: next }));
    void persistAnswer(question.id, next);
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (phase === 'submitting' || phase === 'result') return;
    clearInterval(timerRef.current!);
    setPhase('submitting');

    try {
      const res = await submitAttempt(attemptIdRef.current);
      setResult(res);
      setPhase('result');
    } catch (err) {
      setError(apiErrorMessage(err));
      setPhase('error');
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  const questions: ExamQuestion[] = attempt?.questions ?? [];
  const current = questions[currentIndex];
  const answered = Object.values(answers).filter(Boolean).length;
  const totalQ = questions.length;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerDanger = timeLeft < 120;

  // ── Render ───────────────────────────────────────────────────────────────
  if (phase === 'loading') return <div className="exam-shell"><p className="muted">Starting exam…</p></div>;

  if (phase === 'error') return (
    <div className="exam-shell">
      <p className="error-banner">{error}</p>
      <button className="btn-primary" onClick={() => router.back()}>← Go back</button>
    </div>
  );

  if (phase === 'result' && result) return (
    <div className="exam-shell result-screen">
      <div className={`result-card ${result.passed ? 'passed' : 'failed'}`}>
        <div className="result-icon">{result.passed ? '🎉' : '📚'}</div>
        <h1>{result.passed ? 'Congratulations!' : 'Keep Going!'}</h1>
        <p className="muted">{result.passed ? 'You passed the placement exam.' : 'You did not reach the pass threshold.'}</p>
        <div className="result-stats">
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-value">{result.score} / {result.maxScore}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Percentage</span>
            <span className="stat-value">{result.percentage.toFixed(1)}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pass mark</span>
            <span className="stat-value">{result.passPercentage}%</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => router.push('/dashboard/student/courses')}>
          Back to Courses
        </button>
      </div>
    </div>
  );

  return (
    <div className="exam-shell">
      {/* Header bar */}
      <div className="exam-header">
        <span className="exam-title">Placement Exam</span>
        <span className="exam-progress">{answered}/{totalQ} answered</span>
        <span className={`exam-timer ${timerDanger ? 'danger' : ''}`}>
          ⏱ {mm}:{ss}
        </span>
        <button
          className="btn-submit"
          disabled={phase === 'submitting'}
          onClick={handleSubmit}
        >
          {phase === 'submitting' ? 'Submitting…' : 'Submit Exam'}
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="exam-body">
        {/* Question navigator */}
        <aside className="exam-nav">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`nav-dot ${i === currentIndex ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </aside>

        {/* Question panel */}
        {current && (
          <div className="exam-question">
            <div className="question-meta">
              <span className="q-number">Q{currentIndex + 1} of {totalQ}</span>
              <span className="q-points">{current.points} pt{current.points !== 1 ? 's' : ''}</span>
              <span className="q-diff">{current.difficulty}</span>
              {saving === current.id && <span className="saving-indicator">Saving…</span>}
            </div>
            <p className="question-text">{current.text}</p>
            <div className="options-list">
              {(current.options as { id: string; text: string }[]).map((opt) => {
                const selected = answers[current.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    className={`option-btn ${selected ? 'selected' : ''}`}
                    onClick={() => selectOption(current, opt.id)}
                  >
                    <span className="option-label">{opt.text}</span>
                  </button>
                );
              })}
            </div>
            <div className="exam-nav-btns">
              <button
                className="btn-ghost"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                ← Prev
              </button>
              <button
                className="btn-ghost"
                disabled={currentIndex === totalQ - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
