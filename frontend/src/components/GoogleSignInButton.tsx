'use client';

import { useEffect, useRef } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';

interface Props {
  /** Receives the raw Google ID token (the `credential` field). */
  onCredential: (idToken: string) => void;
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);

    if (existing) {
      if (window.google) {
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
}

/**
 * Renders the official Google button and passes the ID token to the parent.
 * The backend verifies this token against Google's tokeninfo endpoint, so the
 * client id here must be the same one configured as GOOGLE_CLIENT_ID on Render.
 */
export default function GoogleSignInButton({ onCredential }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.endsWith('your-google-client-id')) return;

    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => callbackRef.current(response.credential),
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      })
      .catch(() => {
        // Surfaced by the parent through its own error message.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <div ref={containerRef} />;
}
