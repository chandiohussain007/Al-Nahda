import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
});

const { replaceMock, fetchHealthMock, loginWithGoogleMock, readSessionMock, writeSessionMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  fetchHealthMock: vi.fn(),
  loginWithGoogleMock: vi.fn(),
  readSessionMock: vi.fn(),
  writeSessionMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock('@/lib/api', () => ({
  API_URL: '',
  apiErrorMessage: (error: unknown, fallback = 'Request failed') =>
    error instanceof Error ? error.message : fallback,
  fetchHealth: fetchHealthMock,
  loginWithGoogle: loginWithGoogleMock,
}));

vi.mock('@/lib/session', () => ({
  dashboardPathFor: (role: string) => (role === 'TEACHER' ? '/dashboard/teacher' : '/dashboard/student'),
  readSession: readSessionMock,
  writeSession: writeSessionMock,
}));

vi.mock('@/components/GoogleSignInButton', () => ({
  default: ({ onCredential }: { onCredential: (idToken: string) => void }) => (
    <button type="button" onClick={() => onCredential('demo-google-token')}>
      Continue with Google
    </button>
  ),
}));

vi.mock('@/components/decorative/IslamicPattern', () => ({
  default: () => <div data-testid="pattern" />,
}));

vi.mock('@/components/ui/Badge', () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import LoginPage from './page';

describe('LoginPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');
    fetchHealthMock.mockResolvedValue({ ok: true });
    loginWithGoogleMock.mockResolvedValue({
      accessToken: 'token-123',
      user: { id: 'u-1', email: 'teacher@example.com', role: 'TEACHER' },
    });
    readSessionMock.mockReturnValue(null);
    writeSessionMock.mockImplementation(() => undefined);
  });

  it('signs in with Google and routes according to the role returned by the backend', async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(loginWithGoogleMock).toHaveBeenCalledWith('demo-google-token');
      expect(writeSessionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'token-123',
          user: expect.objectContaining({ role: 'TEACHER' }),
        }),
      );
      expect(replaceMock).toHaveBeenCalledWith('/dashboard/teacher');
    });
    expect(screen.queryByRole('radiogroup')).toBeNull();
  });

  it('shows the backend health state without asking users to choose a role', async () => {
    render(<LoginPage />);

    await waitFor(() => expect(fetchHealthMock).toHaveBeenCalledTimes(1));

    expect(screen.getByText(/Google account registered/i)).toBeTruthy();
    expect(screen.queryByText(/I am signing in as/i)).toBeNull();
  });
});
