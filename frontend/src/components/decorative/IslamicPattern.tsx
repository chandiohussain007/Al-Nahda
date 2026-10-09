import React from 'react';

interface IslamicPatternProps {
  className?: string;
  opacity?: number;
}

/**
 * Geometric Islamic Arabesque 8-point star pattern SVG overlay.
 * Ported verbatim from the AI Studio landing page.
 */
export function IslamicPattern({ className = '', opacity = 0.08 }: IslamicPatternProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg className="h-full w-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic-star-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
            {/* 8-pointed star & Girih lattice lines */}
            <path
              d="M40 0 L49 19 L70 10 L61 31 L80 40 L61 49 L70 70 L49 61 L40 80 L31 61 L10 70 L19 49 L0 40 L19 31 L10 10 L31 19 Z"
              fill="none"
              stroke="#C6A15B"
              strokeWidth="0.8"
            />
            <circle cx="40" cy="40" r="12" fill="none" stroke="#E5D09A" strokeWidth="0.5" />
            <circle cx="0" cy="0" r="10" fill="none" stroke="#C6A15B" strokeWidth="0.5" />
            <circle cx="80" cy="0" r="10" fill="none" stroke="#C6A15B" strokeWidth="0.5" />
            <circle cx="0" cy="80" r="10" fill="none" stroke="#C6A15B" strokeWidth="0.5" />
            <circle cx="80" cy="80" r="10" fill="none" stroke="#C6A15B" strokeWidth="0.5" />
            <path
              d="M0 40 L40 0 M40 80 L80 40 M0 40 L40 80 M40 0 L80 40"
              fill="none"
              stroke="#DED7C8"
              strokeWidth="0.4"
              strokeDasharray="2 2"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-star-pattern)" />
      </svg>
    </div>
  );
}

export default IslamicPattern;
