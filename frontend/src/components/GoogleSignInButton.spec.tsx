import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GoogleSignInButton from './GoogleSignInButton';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

describe('GoogleSignInButton', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'test-client-id');

    Object.defineProperty(window, 'google', {
      value: {
        accounts: {
          id: {
            initialize: vi.fn(),
            renderButton: vi.fn(),
          },
        },
      },
      configurable: true,
    });

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === `script[src="${GOOGLE_SCRIPT_SRC}"]`) {
        return document.createElement('script');
      }
      return null;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (window as { google?: unknown }).google;
  });

  it('initializes Google Identity Services and renders the button when configured', async () => {
    const onCredential = vi.fn();
    const { container } = render(<GoogleSignInButton onCredential={onCredential} />);
    const google = window.google;
    if (!google) throw new Error('Google Identity Services mock was not installed');

    await waitFor(() => {
      expect(google.accounts.id.initialize).toHaveBeenCalledTimes(1);
      expect(google.accounts.id.renderButton).toHaveBeenCalledTimes(1);
    });

    expect(google.accounts.id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-client-id',
        callback: expect.any(Function),
      }),
    );
    expect(google.accounts.id.renderButton).toHaveBeenCalledWith(
      container.firstElementChild,
      expect.objectContaining({ theme: 'outline', size: 'large' }),
    );
    expect(container.firstElementChild).toBeInstanceOf(HTMLDivElement);
  });

  it('does not initialize when the client id is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_CLIENT_ID', '');
    const onCredential = vi.fn();

    render(<GoogleSignInButton onCredential={onCredential} />);
    const google = window.google;
    if (!google) throw new Error('Google Identity Services mock was not installed');

    await waitFor(() => {
      expect(google.accounts.id.initialize).not.toHaveBeenCalled();
    });
  });
});
