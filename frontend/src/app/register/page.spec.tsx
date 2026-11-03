import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { replaceMock, registerStudentMock, readSessionMock, writeSessionMock } = vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
  return {
    replaceMock: vi.fn(),
    registerStudentMock: vi.fn(),
    readSessionMock: vi.fn(),
    writeSessionMock: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/api', () => ({
  apiErrorMessage: (_error: unknown, fallback: string) => fallback,
  loginWithGoogle: vi.fn(),
  registerStudent: registerStudentMock,
}));

vi.mock('@/lib/session', () => ({
  dashboardPathFor: () => '/dashboard/student',
  readSession: readSessionMock,
  writeSession: writeSessionMock,
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
    registerStudentMock.mockResolvedValue({
      accessToken: 'token-reg-123',
      user: { id: 'u-reg', email: 'aisha@example.com', role: 'STUDENT' },
    });
  });

  it('registers a student with email/password and redirects to dashboard', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText('Your full name'), { target: { value: 'Aisha Rahman' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'aisha@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
      target: { value: 'Secret123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Register with Email' }));

    await waitFor(() => {
      expect(registerStudentMock).toHaveBeenCalledWith({
        fullName: 'Aisha Rahman',
        email: 'aisha@example.com',
        password: 'Secret123!',
      });
      expect(writeSessionMock).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith('/dashboard/student');
    });

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  });
});