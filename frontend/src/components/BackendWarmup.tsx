'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';

/**
 * BackendWarmup: Silently pings GET /api/health as soon as the visitor lands on the site.
 * This wakes up the Render container while the user is browsing/scrolling the landing page,
 * ensuring by the time they click Login, Register, or Explore, the backend is warm and ready!
 */
export function BackendWarmup() {
  useEffect(() => {
    if (!API_URL) return;

    // Fire-and-forget lightweight health probe
    fetch(`${API_URL}/api/health`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    }).catch(() => {
      // Fail silently; this is a background pre-warm
    });
  }, []);

  return null;
}
export default BackendWarmup;
