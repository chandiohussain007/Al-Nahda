import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastMock = vi.fn();

const apiMocks = vi.hoisted(() => ({
  fetchTeacherProfile: vi.fn(),
  fetchMyEnrollments: vi.fn(),
  saveTeacherProfile: vi.fn(),
  teacherAcceptEnrollment: vi.fn(),
  teacherRejectEnrollment: vi.fn(),
  fetchAttendance: vi.fn(),
  recordAttendance: vi.fn(),
  sendTeacherNotification: vi.fn(),
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
  fetchTeacherProfile: apiMocks.fetchTeacherProfile,
  fetchMyEnrollments: apiMocks.fetchMyEnrollments,
  saveTeacherProfile: apiMocks.saveTeacherProfile,
  teacherAcceptEnrollment: apiMocks.teacherAcceptEnrollment,
  teacherRejectEnrollment: apiMocks.teacherRejectEnrollment,
  fetchAttendance: apiMocks.fetchAttendance,
  recordAttendance: apiMocks.recordAttendance,
  sendTeacherNotification: apiMocks.sendTeacherNotification,
}));

import TeacherPage from './page';

describe('Teacher dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiMocks.fetchTeacherProfile.mockResolvedValue({
      id: 'teacher-1',
      userId: 'user-1',
      fullName: 'Sheikh Yusuf Ali',
      bio: 'Experienced Quran tutor',
      qualifications: ['Ijazah in Hafs'],
      experienceYears: 5,
      subjectsTaught: ['LEARN_QURAN'],
      phoneNumber: '+92 300 1234567',
      cvUrl: 'https://example.com/cv.pdf',
      availableTimeSlots: ['MORNING'],
      teacherStatus: 'PENDING',
    });

    apiMocks.fetchMyEnrollments.mockResolvedValue([
      {
        id: 'enr-1',
        studentId: 'student-1',
        student: { fullName: 'Aisha Rahman' },
        courseName: 'LEARN_QURAN',
        confirmedLevel: 'BEGINNER',
        preferredTimeSlot: 'MORNING',
        status: 'PENDING',
      },
    ]);

    apiMocks.saveTeacherProfile.mockResolvedValue({
      id: 'teacher-1',
      userId: 'user-1',
      fullName: 'Sheikh Yusuf Ali',
      bio: 'Experienced Quran tutor',
      qualifications: ['Ijazah in Hafs'],
      experienceYears: 5,
      subjectsTaught: ['LEARN_QURAN'],
      phoneNumber: '+92 300 1234567',
      cvUrl: 'https://example.com/cv.pdf',
      availableTimeSlots: ['MORNING'],
      teacherStatus: 'PENDING',
    });

    apiMocks.teacherAcceptEnrollment.mockResolvedValue({ id: 'enr-1', status: 'ACTIVE' });
    apiMocks.teacherRejectEnrollment.mockResolvedValue({ id: 'enr-1', status: 'CANCELLED' });
  });

  it('loads the teacher profile and saves the profile data', async () => {
    render(<TeacherPage />);

    await waitFor(() => expect(apiMocks.fetchTeacherProfile).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));

    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Sheikh Yusuf Ali' },
    });
    fireEvent.change(screen.getByLabelText('Qualifications (comma separated)'), {
      target: { value: 'Ijazah in Hafs, Quran memorization' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile' }));

    await waitFor(() => {
      expect(apiMocks.saveTeacherProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Sheikh Yusuf Ali',
          qualifications: ['Ijazah in Hafs', 'Quran memorization'],
          subjectsTaught: ['LEARN_QURAN'],
          phoneNumber: '+92 300 1234567',
        }),
      );
    });

    expect(toastMock).toHaveBeenCalledWith('Profile saved. Your application is waiting for admin approval.');
  });

  it('accepts a pending enrollment from the enrollments tab', async () => {
    render(<TeacherPage />);

    await waitFor(() => expect(apiMocks.fetchTeacherProfile).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Enrollments' })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Accept' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Accept' })[0]);

    await waitFor(() => {
      expect(apiMocks.teacherAcceptEnrollment).toHaveBeenCalledWith('enr-1');
    });
  });
});
