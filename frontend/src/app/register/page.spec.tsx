import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { pushMock, replaceMock, submitStudentRegistrationMock, readSessionMock } = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
  return {
    pushMock: vi.fn(),
    replaceMock: vi.fn(),
    submitStudentRegistrationMock: vi.fn(),
    readSessionMock: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

vi.mock('@/lib/api', () => ({
  apiErrorMessage: (_error: unknown, fallback: string) => fallback,
  loginWithGoogle: vi.fn(),
  submitStudentRegistration: submitStudentRegistrationMock,
}));

vi.mock('@/lib/session', () => ({
  dashboardPathFor: () => '/dashboard/student',
  readSession: readSessionMock,
  writeSession: vi.fn(),
}));

vi.mock('@/components/GoogleSignInButton', () => ({
  default: () => <button type="button">Continue with Google</button>,
}));

vi.mock('@/components/decorative/IslamicPattern', () => ({
  default: () => <div data-testid="pattern" />,
}));

vi.mock('@/components/feedback/ErrorCard', () => ({
  default: ({ message }: { message?: string }) => <div role="alert">{message}</div>,
}));

import RegisterPage from './page';

describe('RegisterPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
    readSessionMock.mockReturnValue(null);
    submitStudentRegistrationMock.mockResolvedValue({ message: 'sent' });
  });

  it('submits a student registration request and offers Google portal access on the same page', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Aisha Rahman' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'aisha@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Course of interest'), {
      target: { value: 'Quran Recitation & Tajweed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send registration request' }));

    await waitFor(() => {
      expect(submitStudentRegistrationMock).toHaveBeenCalledWith({
        fullName: 'Aisha Rahman',
        email: 'aisha@example.com',
        preferredCourse: 'Quran Recitation & Tajweed',
      });
    });
    expect(await screen.findByText('Registration request sent')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  });
});
