'use client';

import { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface Props {
  /** Receives the raw Google ID token (the `credential` field). */
  onCredential: (idToken: string) => void;
  onError?: (error: Error) => void;
}

let gisLoadingPromise: Promise<void> | null = null;
let lastInitializedClientId: string | null = null;

function loadGisScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (gisLoadingPromise) {
    return gisLoadingPromise;
  }

  gisLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);

    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load Google Sign-In')));
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Google Sign-In'));
    document.head.appendChild(script);
  });

  return gisLoadingPromise;
}

/**
 * Renders the official Google button and passes the ID token to the parent.
 * The backend verifies this token against Google's tokeninfo endpoint, so the
 * client id here must be the same one configured as GOOGLE_CLIENT_ID on Render.
 */
export default function GoogleSignInButton({ onCredential, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const errorCallbackRef = useRef(onError);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    errorCallbackRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.endsWith('your-google-client-id')) return;

    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;

        // Prevent repeated initialization warnings and duplicate listeners in React StrictMode
        if (lastInitializedClientId !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => callbackRef.current(response.credential),
          });
          lastInitializedClientId = clientId;
        }

        // Clear container before rendering to prevent double buttons in StrictMode
        containerRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          errorCallbackRef.current?.(
            error instanceof Error ? error : new Error('Could not load Google Sign-In'),
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={containerRef} />;
}
