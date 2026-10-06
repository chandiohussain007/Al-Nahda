import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, apiErrorMessage, apiStatus } from './api';
import { readSession, writeSession } from './session';
import type { Session } from './types';

const originalAdapter = api.defaults.adapter;

const session: Session = {
  accessToken: 'jwt-token-123',
  user: { id: 'user-1', email: 'aisha@example.com', role: 'STUDENT' },
};

/** Builds an AxiosError carrying a Nest-shaped error body. */
function nestError(status: number, message: string | string[]) {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response: AxiosResponse = {
    data: { statusCode: status, message, error: 'Error' },
    status,
    statusText: 'Error',
    headers: {},
    config,
  };
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_REQUEST',
    config,
    undefined,
    response,
  );
}

describe('apiErrorMessage', () => {
  it('extracts a single message', () => {
    expect(apiErrorMessage(nestError(404, 'Enrollment not found'))).toBe('Enrollment not found');
  });

  it('joins Nest validation messages into one line', () => {
    expect(apiErrorMessage(nestError(400, ['email must be an email', 'role is invalid']))).toBe(
      'email must be an email, role is invalid',
    );
  });

  it('uses the axios message when there is no response body', () => {
    expect(apiErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'), 'fallback')).toBe(
      'Network Error',
    );
  });

  it('returns the fallback for non-axios errors', () => {
    expect(apiErrorMessage(new Error('boom'), 'Something went wrong')).toBe('Something went wrong');
  });
});

describe('apiStatus', () => {
  it('reads the HTTP status from a failed response', () => {
    expect(apiStatus(nestError(404, 'Not found'))).toBe(404);
  });

  it('returns undefined for network errors and plain errors', () => {
    expect(apiStatus(new AxiosError('Network Error', 'ERR_NETWORK'))).toBeUndefined();
    expect(apiStatus(new Error('boom'))).toBeUndefined();
  });
});

describe('api interceptors', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it('attaches the session JWT to outgoing requests', async () => {
    writeSession(session);

    let authorization: unknown;
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      authorization = (config.headers as unknown as Record<string, unknown>).Authorization;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
    };

    await api.get('/api/health');

    expect(authorization).toBe('Bearer jwt-token-123');
  });

  it('omits the Authorization header when signed out', async () => {
    let authorization: unknown = 'not-sent';
    api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      authorization = (config.headers as unknown as Record<string, unknown>).Authorization;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse;
    };

    await api.get('/api/health');

    expect(authorization).toBeUndefined();
  });

  it('clears the session when the API responds 401', async () => {
    writeSession(session);

    api.defaults.adapter = (config: InternalAxiosRequestConfig) => {
      const response: AxiosResponse = {
        data: { statusCode: 401, message: 'Missing bearer token' },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      };
      return Promise.reject(
        new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, undefined, response),
      );
    };

    await expect(api.get('/api/notifications')).rejects.toBeInstanceOf(AxiosError);

    expect(readSession()).toBeNull();
  });
});
