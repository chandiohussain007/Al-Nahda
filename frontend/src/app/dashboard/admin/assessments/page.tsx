'use client';

import { useEffect, useState } from 'react';
import {
  apiErrorMessage,
  createAssessment,
  fetchAssessments,
  fetchQuestions,
  publishAssessment,
  setAssessmentQuestions,
} from '@/lib/api';
import type { Assessment, Question } from '@/lib/types';

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  // Selected assessment for question builder
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [savingQs, setSavingQs] = useState(false);

  // Create form
  const [form, setForm] = useState({
    title: '', description: '', courseId: '', durationMinutes: 30,
    passPercentage: 60, attemptsAllowed: 1, questionsPerAttempt: 10,
  });

  useEffect(() => {
    Promise.all([fetchAssessments(), fetchQuestions()])
      .then(([a, q]) => { setAssessments(a); setQuestions(q); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const a = await createAssessment({
        ...form,
        courseId: form.courseId || 'placeholder', // swap for real CourseItem id
      });
      setAssessments((prev) => [a, ...prev]);
      setForm({ title: '', description: '', courseId: '', durationMinutes: 30, passPercentage: 60, attemptsAllowed: 1, questionsPerAttempt: 10 });
      setShowCreate(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      const updated = await publishAssessment(id);
      setAssessments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  function openBuilder(a: Assessment) {
    setEditing(a);
    setSelectedQIds([]);
  }

  function toggleQ(id: string) {
    setSelectedQIds((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id],
    );
  }

  async function saveQuestions() {
    if (!editing) return;
    setSavingQs(true);
    setError('');
    try {
      const updated = await setAssessmentQuestions(editing.id, selectedQIds);
      setAssessments((prev) => prev.map((a) => (a.id === editing.id ? updated : a)));
      setEditing(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingQs(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Assessments</h1>
        <button className="btn-primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? '✕ Cancel' : '+ New Assessment'}
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {showCreate && (
        <form className="card form-card" onSubmit={handleCreate}>
          <h2>Create Assessment</h2>
          <label>Title <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
          <label>Description <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          <div className="form-row">
            <label>Duration (min) <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: +e.target.value }))} /></label>
            <label>Pass % <input type="number" min={1} max={100} value={form.passPercentage} onChange={(e) => setForm((p) => ({ ...p, passPercentage: +e.target.value }))} /></label>
            <label>Attempts allowed <input type="number" min={1} value={form.attemptsAllowed} onChange={(e) => setForm((p) => ({ ...p, attemptsAllowed: +e.target.value }))} /></label>
            <label>Qs per attempt <input type="number" min={1} value={form.questionsPerAttempt} onChange={(e) => setForm((p) => ({ ...p, questionsPerAttempt: +e.target.value }))} /></label>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
        </form>
      )}

      {/* Assessment cards */}
      <div className="assessment-list">
        {assessments.length === 0
          ? <p className="muted">No assessments yet.</p>
          : assessments.map((a) => (
            <div key={a.id} className="assessment-card">
              <div className="a-header">
                <div>
                  <strong>{a.title}</strong>
                  <span className={`a-status ${a.status.toLowerCase()}`}>{a.status}</span>
                </div>
                <div className="a-actions">
                  <button className="btn-sm" onClick={() => openBuilder(a)}>Edit Questions</button>
                  {a.status === 'DRAFT' && (
                    <button className="btn-primary btn-sm" onClick={() => handlePublish(a.id)}>Publish</button>
                  )}
                </div>
              </div>
              <div className="a-meta">
                <span>⏱ {a.durationMinutes} min</span>
                <span>✓ Pass: {a.passPercentage}%</span>
                <span>🔁 Attempts: {a.attemptsAllowed}</span>
                <span>❓ {a._count?.questions ?? 0} questions</span>
              </div>
              {a.description && <p className="muted">{a.description}</p>}
            </div>
          ))}
      </div>

      {/* Question builder modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <h2>Select Questions for "{editing.title}"</h2>
            <p className="muted">Check questions to include. Order matters — drag-to-reorder coming soon.</p>
            <div className="q-picker">
              {questions.length === 0
                ? <p className="muted">No questions in bank yet.</p>
                : questions.map((q) => (
                  <label key={q.id} className={`q-pick-row ${selectedQIds.includes(q.id) ? 'checked' : ''}`}>
                    <input type="checkbox" checked={selectedQIds.includes(q.id)} onChange={() => toggleQ(q.id)} />
                    <span className="q-badge">{q.course.replace('_', ' ')} · {q.level} · {q.difficulty}</span>
                    <span className="q-text">{q.text}</span>
                    <span className="q-pts">{q.points}pt</span>
                  </label>
                ))}
            </div>
            <p className="muted">{selectedQIds.length} selected</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={savingQs || selectedQIds.length === 0} onClick={saveQuestions}>
                {savingQs ? 'Saving…' : 'Save Question Set'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
