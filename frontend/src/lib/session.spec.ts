import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, dashboardPathFor, readSession, writeSession } from './session';
import type { Session } from './types';

const STORAGE_KEY = 'al-nahda.session';

const sample: Session = {
  accessToken: 'jwt-token-123',
  user: { id: 'user-1', email: 'aisha@example.com', role: 'STUDENT' },
};

describe('session', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull();
  });

  it('round-trips a session through localStorage', () => {
    writeSession(sample);

    expect(readSession()).toEqual(sample);
  });

  it('clears the stored session', () => {
    writeSession(sample);
    clearSession();

    expect(readSession()).toBeNull();
  });

  it('ignores malformed JSON instead of throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json');

    expect(readSession()).toBeNull();
  });

  it('rejects sessions that are missing required fields', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: { role: 'STUDENT' } }));
    expect(readSession()).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: 'x' }));
    expect(readSession()).toBeNull();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: 'x', user: { id: 'u', email: 'e' } }),
    );
    expect(readSession()).toBeNull();
  });

  it('returns null during server-side rendering', () => {
    writeSession(sample);

    // Simulates the Node/SSR context where window does not exist.
    vi.stubGlobal('window', undefined);
    expect(readSession()).toBeNull();
  });

  it('maps every role to its own dashboard', () => {
    expect(dashboardPathFor('STUDENT')).toBe('/dashboard/student');
    expect(dashboardPathFor('TEACHER')).toBe('/dashboard/teacher');
    expect(dashboardPathFor('ADMIN')).toBe('/dashboard/admin');
  });
});
