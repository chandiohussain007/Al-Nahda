'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  apiErrorMessage,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from '@/lib/api';
import type { AttemptResult, ExamQuestion, StartAttemptResponse } from '@/lib/types';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Award, AlertTriangle, Check } from 'lucide-react';

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

  // ── Swipe Navigation ─────────────────────────────────────────────────────
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    const totalQ = attempt?.questions.length ?? 0;
    if (diff > threshold && currentIndex < totalQ - 1) setCurrentIndex(i => i + 1);
    if (diff < -threshold && currentIndex > 0) setCurrentIndex(i => i - 1);
    touchStartX.current = null;
  };

  // ── Keyboard Navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'exam') return;
      const totalQ = attempt?.questions.length ?? 0;
      if (e.key === 'ArrowRight' && currentIndex < totalQ - 1) setCurrentIndex(i => i + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentIndex, attempt]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const questions: ExamQuestion[] = attempt?.questions ?? [];
  const current = questions[currentIndex];
  const answered = Object.values(answers).filter(Boolean).length;
  const totalQ = questions.length;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerDanger = timeLeft < 120;

  // ── Render ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent"></div>
          <p className="text-lg font-medium text-slate-500 dark:text-gold-light">Starting exam…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 font-serif text-xl font-bold text-charcoal dark:text-ivory">Error</h2>
          <p className="mb-6 text-slate-500">{error}</p>
          <Button variant="primary" onClick={() => router.back()} className="w-full">
            <ChevronLeft className="mr-2 h-4 w-4" /> Go back
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className={`w-full max-w-lg text-center overflow-hidden border-t-4 ${result.passed ? 'border-t-green-500' : 'border-t-gold'}`}>
          <div className="py-6">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${result.passed ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gold/20 text-gold'}`}>
              {result.passed ? <Award className="h-10 w-10" /> : <Clock className="h-10 w-10" />}
            </div>
            <h1 className="mb-2 font-serif text-3xl font-bold text-primary dark:text-ivory">
              {result.passed ? 'Congratulations!' : 'Keep Going!'}
            </h1>
            <p className="mb-8 text-slate-600 dark:text-gold-light/80">
              {result.passed ? 'You passed the placement exam.' : 'You did not reach the pass threshold.'}
            </p>

            <div className="mb-8 grid grid-cols-3 gap-4 divide-x divide-sandstone/50 rounded-xl bg-surface p-4 dark:divide-gold/20 dark:bg-primary/30">
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-slate-500">Score</span>
                <span className="text-xl font-bold text-charcoal dark:text-ivory">{result.score}/{result.maxScore}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-slate-500">Percentage</span>
                <span className="text-xl font-bold text-charcoal dark:text-ivory">{result.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-wider text-slate-500">Required</span>
                <span className="text-xl font-bold text-charcoal dark:text-ivory">{result.passPercentage}%</span>
              </div>
            </div>

            <Button variant="primary" onClick={() => router.push('/dashboard/student/courses')} className="w-full py-4 text-lg">
              Back to Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col bg-deep text-ivory">
      {/* Header bar */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-primary/95 p-4 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="m-0 font-serif text-lg font-bold text-gold md:text-xl">Placement Exam</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-teal transition-all duration-300" style={{ width: `${(answered / totalQ) * 100}%` }}></div>
            </div>
            <span className="text-xs text-gold-light/70">{answered}/{totalQ} answered</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold transition-colors ${timerDanger ? 'animate-pulse bg-red-900/40 text-red-400' : 'bg-white/5 text-ivory'}`}>
            <Clock className="h-5 w-5" />
            <span>{mm}:{ss}</span>
          </div>
          <Button
            variant={answered === totalQ ? 'primary' : 'secondary'}
            disabled={phase === 'submitting'}
            onClick={handleSubmit}
            className="md:px-6"
          >
            {phase === 'submitting' ? 'Submitting…' : 'Submit Exam'}
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div
        className="flex flex-1 flex-col-reverse md:flex-row"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Question navigator (bottom on mobile, side on desktop) */}
        <nav
          aria-label="Question navigation"
          className="border-t border-white/10 bg-primary/50 p-4 md:w-64 md:border-r md:border-t-0 md:p-6"
        >
          <div className="grid grid-cols-5 gap-2 md:grid-cols-4 lg:grid-cols-5">
            {questions.map((q, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = !!answers[q.id];
              return (
                <button
                  key={q.id}
                  aria-label={`Question ${i + 1}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 md:h-10 md:w-full ${
                    isCurrent
                      ? 'bg-gold text-primary shadow-lg ring-2 ring-gold ring-offset-2 ring-offset-deep'
                      : isAnswered
                      ? 'bg-teal/40 text-teal-100 hover:bg-teal/60'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 hidden md:block">
            <p className="text-xs text-slate-500 text-center">
              Use arrow keys <kbd className="bg-white/10 px-1 py-0.5 rounded text-white mx-1">←</kbd> <kbd className="bg-white/10 px-1 py-0.5 rounded text-white mx-1">→</kbd> to navigate
            </p>
          </div>
        </nav>

        {/* Question panel */}
        {current && (
          <main className="flex flex-1 flex-col p-4 md:p-8 lg:p-12">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge tone="info" className="text-base px-3 py-1">Question {currentIndex + 1}</Badge>
                <Badge tone={current.difficulty === 'HARD' ? 'danger' : current.difficulty === 'MEDIUM' ? 'warning' : 'success'}>
                  {current.difficulty}
                </Badge>
                <span className="text-sm font-medium text-gold-light/60">{current.points} pt{current.points !== 1 ? 's' : ''}</span>
              </div>
              <div className="h-6">
                {saving === current.id && (
                  <span className="flex items-center gap-2 text-xs font-medium text-teal-400">
                    <span className="h-2 w-2 animate-ping rounded-full bg-teal-400"></span> Saving…
                  </span>
                )}
              </div>
            </div>

            <h2 className="mb-8 font-serif text-2xl font-bold leading-relaxed text-ivory md:text-3xl lg:text-4xl">
              {current.text}
            </h2>

            <div
              role="radiogroup"
              aria-label="Answer options"
              className="mb-12 flex flex-col gap-4"
            >
              {(current.options as { id: string; text: string }[]).map((opt) => {
                const selected = answers[current.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={selected}
                    className={`group flex min-h-[64px] w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-deep md:p-6 ${
                      selected
                        ? 'border-gold bg-gold/10 shadow-[0_0_15px_rgba(198,161,91,0.15)]'
                        : 'border-white/10 bg-white/5 hover:border-gold/50 hover:bg-white/10'
                    }`}
                    onClick={() => selectOption(current, opt.id)}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selected ? 'border-gold bg-gold text-primary' : 'border-white/20 text-transparent group-hover:border-gold/50'
                    }`}>
                      {selected ? <Check className="h-5 w-5" /> : opt.id.toUpperCase()}
                    </div>
                    <span className={`text-lg md:text-xl ${selected ? 'font-medium text-gold-light' : 'text-slate-300 group-hover:text-ivory'}`}>
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                size="lg"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="text-gold-light hover:bg-white/10 hover:text-gold"
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Previous
              </Button>
              <Button
                variant="ghost"
                size="lg"
                disabled={currentIndex === totalQ - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="text-gold-light hover:bg-white/10 hover:text-gold"
              >
                Next <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
