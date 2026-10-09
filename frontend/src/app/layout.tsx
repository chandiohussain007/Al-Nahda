import type { Metadata } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/feedback/Toast';
import { ThemeProvider } from '@/context/ThemeProvider';
import { LanguageProvider } from '@/context/LanguageContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Al Nahda — Quran & Arabic Academy',
    template: '%s | Al Nahda',
  },
  description:
    'Al Nahda Islamic Academy — authentic Quran, Tajweed, Classical Arabic and Islamic sciences education with authorized scholars, live circles and verified certificates.',
  keywords: [
    'Quran',
    'Tajweed',
    'Arabic',
    'Nahw',
    'Islamic education',
    'online madrasa',
    'Al Nahda',
  ],
  openGraph: {
    title: 'Al Nahda — Quran & Arabic Academy',
    description:
      'Authentic Quran, Tajweed, Classical Arabic and Islamic sciences education with authorized scholars.',
    type: 'website',
    siteName: 'Al Nahda',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Typography per the AI Studio design system: Cinzel for display,
            Plus Jakarta Sans for UI, Amiri for Arabic/RTL content. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cinzel:wght@400..800&family=Plus+Jakarta+Sans:wght@400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
