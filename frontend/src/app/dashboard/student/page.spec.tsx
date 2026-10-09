import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const toastMock = vi.fn();

const apiMocks = vi.hoisted(() => ({
  fetchStudentProfile: vi.fn(),
  fetchStudentProgress: vi.fn(),
  saveStudentProfile: vi.fn(),
  fetchEvaluationQuestions: vi.fn(),
  submitEvaluation: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/components/RequireRole', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/feedback/Toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/api', () => ({
  apiErrorMessage: (error: unknown, fallback = 'Request failed') =>
    error instanceof Error ? error.message : fallback,
  apiStatus: (error: unknown) => (error as { response?: { status?: number } })?.response?.status,
  fetchStudentProfile: apiMocks.fetchStudentProfile,
  fetchStudentProgress: apiMocks.fetchStudentProgress,
  saveStudentProfile: apiMocks.saveStudentProfile,
  fetchEvaluationQuestions: apiMocks.fetchEvaluationQuestions,
  submitEvaluation: apiMocks.submitEvaluation,
}));

import StudentPage from './page';

describe('Student dashboard smoke flow', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    apiMocks.fetchStudentProfile.mockResolvedValue({
      id: 'student-1',
      fullName: 'Aisha Rahman',
      whatsappNumber: '+971500000000',
      bio: 'Loves Quran',
    });

    apiMocks.fetchStudentProgress.mockResolvedValue({
      studentId: 'student-1',
      fullName: 'Aisha Rahman',
      totalEnrollments: 1,
      activeEnrollments: 1,
      attendance: { PRESENT: 4, ABSENT: 1, EXCUSED: 1, totalSessions: 6, attendanceRate: 80 },
      latestEvaluations: [{ id: 'eval-1', claimedLevel: 'BEGINNER', assignedLevel: 'BEGINNER', score: 80, status: 'PASSED', startedAt: '2024-01-01', completedAt: '2024-01-01' }],
      enrollments: [],
    });

    apiMocks.saveStudentProfile.mockResolvedValue({
      id: 'student-1',
      fullName: 'Aisha Rahman',
      whatsappNumber: '+971500000000',
      bio: 'Loves Quran and Arabic',
    });

    apiMocks.fetchEvaluationQuestions.mockResolvedValue([
      {
        id: 'q1',
        course: 'LEARN_QURAN',
        level: 'BEGINNER',
        question: 'Which letter is recognized as the first letter of the Arabic alphabet?',
        options: ['Alif', 'Baa', 'Jeem'],
      },
    ]);

    apiMocks.submitEvaluation.mockResolvedValue({
      id: 'eval-2',
      studentId: 'student-1',
      claimedLevel: 'BEGINNER',
      assignedLevel: 'BEGINNER',
      score: 100,
      status: 'PASSED',
      startedAt: '2024-01-02',
      completedAt: '2024-01-02',
    });
  });

  it('saves the student profile and updates the dashboard state', async () => {
    render(<StudentPage />);

    await waitFor(() => expect(apiMocks.fetchStudentProfile).toHaveBeenCalledTimes(1));

    const fullNameInput = screen.getByLabelText('Full name');
    fireEvent.change(fullNameInput, { target: { value: 'Aisha Rahman' } });

    const whatsappInput = screen.getByLabelText('WhatsApp number');
    fireEvent.change(whatsappInput, { target: { value: '+971500000000' } });

    const bioInput = screen.getByLabelText('Bio');
    fireEvent.change(bioInput, { target: { value: 'Loves Quran and Arabic' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() => {
      expect(apiMocks.saveStudentProfile).toHaveBeenCalledWith({
        fullName: 'Aisha Rahman',
        whatsappNumber: '+971500000000',
        bio: 'Loves Quran and Arabic',
      });
    });

    expect(toastMock).toHaveBeenCalledWith('Profile saved.');
  });

  it('loads placement questions and submits a complete evaluation', async () => {
    render(<StudentPage />);

    await waitFor(() => expect(apiMocks.fetchStudentProfile).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /Load questions/i }));

    await waitFor(() => {
      expect(apiMocks.fetchEvaluationQuestions).toHaveBeenCalledWith('LEARN_QURAN', 'BEGINNER');
    });

    fireEvent.click(screen.getByLabelText('Alif'));
    fireEvent.click(screen.getByRole('button', { name: /Submit evaluation/i }));

    await waitFor(() => {
      expect(apiMocks.submitEvaluation).toHaveBeenCalledWith({
        course: 'LEARN_QURAN',
        claimedLevel: 'BEGINNER',
        answers: [{ questionId: 'q1', answer: 'Alif' }],
      });
    });

    expect(await screen.findByText(/Score 100%/i)).toBeTruthy();
  });
});
