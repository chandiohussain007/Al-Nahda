'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { apiErrorMessage, createQuestion, deleteQuestion, fetchQuestions } from '@/lib/api';
import type { Course, Difficulty, Level, Question } from '@/lib/types';
import { BookOpen, Trash2, Plus, X } from 'lucide-react';

const COURSES: Course[] = ['LEARN_QURAN', 'LEARN_ARABIC'];
const LEVELS: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const DIFF_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger'
};

interface NewQ {
  text: string;
  course: Course;
  level: Level;
  difficulty: Difficulty;
  options: { id: string; text: string }[];
  correctOptionId: string;
  points: number;
  explanation: string;
}

const defaultForm = (): NewQ => ({
  text: '', course: 'LEARN_QURAN', level: 'BEGINNER', difficulty: 'MEDIUM',
  options: [
    { id: 'a', text: '' }, { id: 'b', text: '' },
    { id: 'c', text: '' }, { id: 'd', text: '' },
  ],
  correctOptionId: 'a', points: 1, explanation: '',
});

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewQ>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState<Course | ''>('');
  const [levelFilter, setLevelFilter] = useState<Level | ''>('');

  function load() {
    setLoading(true);
    fetchQuestions({ course: courseFilter || undefined, level: levelFilter || undefined })
      .then(setQuestions)
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }

  useEffect(load, [courseFilter, levelFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const q = await createQuestion({
        text: form.text,
        course: form.course,
        level: form.level,
        difficulty: form.difficulty,
        options: JSON.stringify(form.options),
        correctOptionId: form.correctOptionId,
        points: form.points,
        explanation: form.explanation || undefined,
      });
      setQuestions((prev) => [q, ...prev]);
      setForm(defaultForm());
      setShowForm(false);
      toast('Question created successfully.', 'success');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast('Question deleted.', 'info');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function setOption(index: number, text: string) {
    setForm((prev) => {
      const opts = [...prev.options];
      opts[index] = { ...opts[index], text };
      return { ...prev, options: opts };
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 flex items-center gap-2 font-serif text-2xl font-bold text-primary dark:text-gold">
            <BookOpen className="h-6 w-6" /> Question Bank
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            {questions.length} question{questions.length !== 1 ? 's' : ''} available.
          </p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2"
        >
          {showForm ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> Add Question</>}
        </Button>
      </header>

      {error && <ErrorCard message={error} />}

      {showForm && (
        <Card className="border-teal/30 bg-teal/5 dark:border-teal/20 dark:bg-teal/10">
          <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
            New Question
          </h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Course">
                {(p) => (
                  <Select
                    {...p}
                    value={form.course}
                    onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value as Course }))}
                  >
                    {COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace('_', ' ')}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Level">
                {(p) => (
                  <Select
                    {...p}
                    value={form.level}
                    onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value as Level }))}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Difficulty">
                {(p) => (
                  <Select
                    {...p}
                    value={form.difficulty}
                    onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
              <FormField label="Points">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    value={form.points}
                    onChange={(e) => setForm((prev) => ({ ...prev, points: Number(e.target.value) }))}
                  />
                )}
              </FormField>
            </div>

            <FormField label="Question text" hint="Required">
              {(p) => (
                <Textarea
                  {...p}
                  required
                  rows={3}
                  value={form.text}
                  onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                />
              )}
            </FormField>

            <fieldset className="rounded-lg border border-sandstone/60 p-4 dark:border-gold/20">
              <legend className="px-2 text-sm font-semibold text-primary dark:text-gold">
                Answer Options
              </legend>
              <div className="mt-2 space-y-3">
                {form.options.map((opt, i) => (
                  <label key={opt.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correct"
                      value={opt.id}
                      checked={form.correctOptionId === opt.id}
                      onChange={() => setForm((prev) => ({ ...prev, correctOptionId: opt.id }))}
                      className="h-4 w-4"
                    />
                    <span className="w-6 font-bold text-slate-500">{opt.id.toUpperCase()}.</span>
                    <Input
                      placeholder={`Option ${opt.id.toUpperCase()}`}
                      required
                      value={opt.text}
                      onChange={(e) => setOption(i, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-gold-light/70">
                Select the radio button next to the correct answer.
              </p>
            </fieldset>

            <FormField label="Explanation (optional)">
              {(p) => (
                <Input
                  {...p}
                  value={form.explanation}
                  onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))}
                />
              )}
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Question'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-surface p-4 shadow-sm dark:bg-primary/50">
        <span className="text-sm font-medium text-slate-600 dark:text-ivory">Filter by:</span>
        <Select
          className="w-40"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value as Course | '')}
        >
          <option value="">All Courses</option>
          {COURSES.map((c) => (
            <option key={c} value={c}>
              {c.replace('_', ' ')}
            </option>
          ))}
        </Select>
        <Select
          className="w-40"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as Level | '')}
        >
          <option value="">All Levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <SkeletonLoader rows={3} height="h-32" />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No questions found"
          description="Add a new question or adjust your filters."
        />
      ) : (
        <div className="grid gap-4">
          {questions.map((q) => (
            <Card key={q.id} className="flex flex-col">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">{q.course.replace('_', ' ')}</Badge>
                  <Badge tone="info">{q.level}</Badge>
                  <Badge tone={DIFF_COLORS[q.difficulty]}>{q.difficulty}</Badge>
                  <span className="text-sm font-medium text-slate-500 dark:text-gold-light/70">
                    {q.points} pt{q.points !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(q.id)}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="mb-4 text-base font-medium text-charcoal dark:text-ivory">{q.text}</p>

              <div className="grid gap-2 sm:grid-cols-2">
                {(q.options as { id: string; text: string }[]).map((opt) => {
                  const isCorrect = opt.id === q.correctOptionId;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                        isCorrect
                          ? 'border border-green-200 bg-green-50 font-medium text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200'
                          : 'border border-sandstone/30 bg-surface text-slate-600 dark:border-white/5 dark:bg-deep/50 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold opacity-70">{opt.id.toUpperCase()}.</span>
                      <span>{opt.text}</span>
                      {isCorrect && <span className="ml-auto text-green-600 dark:text-green-400">✓</span>}
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-4 rounded border-l-2 border-gold/50 bg-gold/5 p-3 text-sm text-slate-600 dark:border-gold dark:text-gold-light/90">
                  <span className="font-semibold">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
