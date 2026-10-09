'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/Toast';
import { Settings, Plus, X, ListChecks, CheckCircle2, Clock, Percent } from 'lucide-react';
import {
  apiErrorMessage,
  createAssessment,
  fetchAssessments,
  fetchCourses,
  fetchQuestions,
  publishAssessment,
  setAssessmentQuestions,
} from '@/lib/api';
import type { Assessment, CourseItem, Question } from '@/lib/types';

export default function AdminAssessmentsPage() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
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
    Promise.all([fetchAssessments(), fetchQuestions(), fetchCourses()])
      .then(([a, q, c]) => { setAssessments(a); setQuestions(q); setCourses(c); })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const a = await createAssessment({ ...form, courseId: form.courseId });
      setAssessments((prev) => [a, ...prev]);
      setForm({ title: '', description: '', courseId: '', durationMinutes: 30, passPercentage: 60, attemptsAllowed: 1, questionsPerAttempt: 10 });
      setShowCreate(false);
      toast('Assessment created successfully.', 'success');
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
      toast('Assessment published.', 'success');
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
      toast('Questions saved successfully.', 'success');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSavingQs(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="m-0 flex items-center gap-2 font-serif text-2xl font-bold text-primary dark:text-gold">
            <Settings className="h-6 w-6" /> Assessments
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gold-light/80">
            Create and manage placement exams and tests.
          </p>
        </div>
        <Button
          variant={showCreate ? 'secondary' : 'primary'}
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2"
        >
          {showCreate ? <><X className="h-4 w-4" /> Cancel</> : <><Plus className="h-4 w-4" /> New Assessment</>}
        </Button>
      </header>

      {error && <ErrorCard message={error} />}

      {showCreate && (
        <Card className="border-teal/30 bg-teal/5 dark:border-teal/20 dark:bg-teal/10">
          <h2 className="m-0 mb-4 font-serif text-lg font-semibold text-primary dark:text-gold">
            Create Assessment
          </h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Title" hint="Required">
                {(p) => (
                  <Input
                    {...p}
                    required
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                )}
              </FormField>
              <FormField label="Course">
                {(p) => (
                  <Select
                    {...p}
                    required
                    value={form.courseId}
                    onChange={(e) => setForm((prev) => ({ ...prev, courseId: e.target.value }))}
                  >
                    <option value="" disabled>Select a course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
              </FormField>
            </div>

            <FormField label="Description">
              {(p) => (
                <Input
                  {...p}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Duration (min)">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: +e.target.value }))}
                  />
                )}
              </FormField>
              <FormField label="Pass %">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    max={100}
                    value={form.passPercentage}
                    onChange={(e) => setForm((prev) => ({ ...prev, passPercentage: +e.target.value }))}
                  />
                )}
              </FormField>
              <FormField label="Attempts allowed">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    value={form.attemptsAllowed}
                    onChange={(e) => setForm((prev) => ({ ...prev, attemptsAllowed: +e.target.value }))}
                  />
                )}
              </FormField>
              <FormField label="Qs per attempt">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={1}
                    value={form.questionsPerAttempt}
                    onChange={(e) => setForm((prev) => ({ ...prev, questionsPerAttempt: +e.target.value }))}
                  />
                )}
              </FormField>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Create'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <SkeletonLoader rows={3} height="h-40" />
      ) : assessments.length === 0 ? (
        <EmptyState
          icon={<Settings className="h-8 w-8" />}
          title="No assessments"
          description="Create a new assessment to get started."
        />
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => (
            <Card key={a.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="m-0 font-serif text-lg font-bold text-primary dark:text-ivory">
                      {a.title}
                    </h3>
                    <Badge tone={a.status === 'PUBLISHED' ? 'success' : 'warning'}>
                      {a.status}
                    </Badge>
                  </div>
                  {a.description && <p className="mt-1 text-sm text-slate-500">{a.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openBuilder(a)}>
                    <ListChecks className="mr-2 h-4 w-4" /> Edit Questions
                  </Button>
                  {a.status === 'DRAFT' && (
                    <Button size="sm" variant="primary" onClick={() => handlePublish(a.id)}>
                      Publish
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-gold-light/70">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {a.durationMinutes} min</span>
                <span className="flex items-center gap-1"><Percent className="h-4 w-4" /> Pass: {a.passPercentage}%</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Attempts: {a.attemptsAllowed}</span>
                <span className="flex items-center gap-1 font-medium text-charcoal dark:text-ivory">
                  ❓ {a._count?.questions ?? 0} questions
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-sandstone/30 pb-4 dark:border-gold/20">
              <h2 className="m-0 font-serif text-xl font-bold text-primary dark:text-gold">
                Select Questions for "{editing.title}"
              </h2>
              <p className="mt-1 text-sm text-slate-500">Check questions to include. Order matters.</p>
            </div>

            <div className="overflow-y-auto py-4 space-y-2 flex-1">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-500">No questions in bank yet.</p>
              ) : (
                questions.map((q) => {
                  const isChecked = selectedQIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isChecked
                          ? 'border-teal/50 bg-teal/5 dark:border-teal/50 dark:bg-teal/10'
                          : 'border-sandstone/30 hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleQ(q.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-1">
                          <Badge tone="info">{q.course.replace('_', ' ')}</Badge>
                          <Badge tone="info">{q.level}</Badge>
                          <Badge tone="warning">{q.difficulty}</Badge>
                        </div>
                        <span className="text-sm text-charcoal dark:text-ivory">{q.text}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-500">{q.points}pt</div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="border-t border-sandstone/30 pt-4 flex items-center justify-between dark:border-gold/20 mt-auto">
              <span className="text-sm font-medium text-slate-600 dark:text-ivory">
                {selectedQIds.length} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button variant="primary" disabled={savingQs || selectedQIds.length === 0} onClick={saveQuestions}>
                  {savingQs ? 'Saving…' : 'Save Question Set'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
