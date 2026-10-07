'use client';

import { useEffect, useState } from 'react';
import { apiErrorMessage, createQuestion, deleteQuestion, fetchQuestions } from '@/lib/api';
import type { Course, Difficulty, Level, Question } from '@/lib/types';

const COURSES: Course[] = ['LEARN_QURAN', 'LEARN_ARABIC'];
const LEVELS: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const DIFF_COLORS: Record<string, string> = { EASY: '#10b981', MEDIUM: '#f59e0b', HARD: '#ef4444' };

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
      .catch(() => {})
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
    <div>
      <div className="page-header">
        <h1>Question Bank</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? '✕ Cancel' : '+ Add Question'}
        </button>
      </div>
      <p className="muted">{questions.length} question{questions.length !== 1 ? 's' : ''} in bank</p>

      {error && <p className="error-banner">{error}</p>}

      {/* Create form */}
      {showForm && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h2>New Question</h2>
          <div className="form-row">
            <label>Course
              <select value={form.course} onChange={(e) => setForm((p) => ({ ...p, course: e.target.value as Course }))}>
                {COURSES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </label>
            <label>Level
              <select value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as Level }))}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <label>Difficulty
              <select value={form.difficulty} onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Points
              <input type="number" min={1} value={form.points}
                onChange={(e) => setForm((p) => ({ ...p, points: Number(e.target.value) }))} />
            </label>
          </div>
          <label>Question text
            <textarea required rows={3} value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))} />
          </label>
          <fieldset className="options-fieldset">
            <legend>Answer Options</legend>
            {form.options.map((opt, i) => (
              <label key={opt.id} className="option-row">
                <input type="radio" name="correct" value={opt.id}
                  checked={form.correctOptionId === opt.id}
                  onChange={() => setForm((p) => ({ ...p, correctOptionId: opt.id }))} />
                <span className="opt-label">{opt.id.toUpperCase()}.</span>
                <input type="text" placeholder={`Option ${opt.id.toUpperCase()}`} required
                  value={opt.text} onChange={(e) => setOption(i, e.target.value)} />
              </label>
            ))}
            <p className="muted hint">Select the radio button next to the correct answer.</p>
          </fieldset>
          <label>Explanation (optional)
            <input type="text" value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))} />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Question'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="toolbar">
        <label>Course:&nbsp;
          <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value as Course | '')}>
            <option value="">All</option>
            {COURSES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
          </select>
        </label>
        <label>Level:&nbsp;
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as Level | '')}>
            <option value="">All</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>

      {/* Question list */}
      {loading ? <p className="muted">Loading…</p> : (
        <div className="question-list">
          {questions.length === 0
            ? <p className="muted">No questions yet. Add one above.</p>
            : questions.map((q) => (
              <div key={q.id} className="question-card">
                <div className="q-header">
                  <span className="q-badge">{q.course.replace('_', ' ')} · {q.level}</span>
                  <span className="diff-badge" style={{ color: DIFF_COLORS[q.difficulty] }}>{q.difficulty}</span>
                  <span className="q-pts">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                  <button className="btn-danger-sm" onClick={() => handleDelete(q.id)}>Delete</button>
                </div>
                <p className="q-text">{q.text}</p>
                <ul className="q-options">
                  {(q.options as { id: string; text: string }[]).map((opt) => (
                    <li key={opt.id} className={opt.id === q.correctOptionId ? 'correct' : ''}>
                      {opt.id.toUpperCase()}. {opt.text}
                      {opt.id === q.correctOptionId && ' ✓'}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
