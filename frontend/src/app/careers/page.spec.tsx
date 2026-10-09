import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { submitTeacherApplicationMock } = vi.hoisted(() => ({
  submitTeacherApplicationMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiErrorMessage: (_error: unknown, fallback: string) => fallback,
  submitTeacherApplication: submitTeacherApplicationMock,
}));

vi.mock('@/components/decorative/IslamicPattern', () => ({
  default: () => <div data-testid="pattern" />,
}));

vi.mock('@/components/feedback/ErrorCard', () => ({
  default: ({ message }: { message?: string }) => <div role="alert">{message}</div>,
}));

import CareersPage from './page';

describe('CareersPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    submitTeacherApplicationMock.mockResolvedValue({ message: 'sent' });
  });

  it('sends teacher contact and experience details to the application endpoint', async () => {
    render(<CareersPage />);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Omar Hassan' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'omar@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contact number'), {
      target: { value: '+971500000000' },
    });
    fireEvent.change(screen.getByLabelText('Subject you would like to teach'), {
      target: { value: 'Arabic' },
    });
    fireEvent.change(screen.getByLabelText('Teaching experience'), {
      target: { value: 'Five years teaching adult learners.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send application' }));

    await waitFor(() => {
      expect(submitTeacherApplicationMock).toHaveBeenCalledWith({
        fullName: 'Omar Hassan',
        email: 'omar@example.com',
        phoneNumber: '+971500000000',
        subject: 'Arabic',
        experience: 'Five years teaching adult learners.',
      });
    });
    expect(await screen.findByText('Application sent')).toBeTruthy();
  });
});
