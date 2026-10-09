'use client';

import { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/context/ThemeProvider';
import type { UserRole } from '@/lib/types';

export interface AppNavbarProps {
  email: string;
  role: UserRole;
  /** Role-specific dashboard home path. */
  home: string;
  /** Current pathname for active-link styling. */
  pathname: string;
  onSignOut: () => void;
}

interface NavLink {
  href: string;
  label: string;
}

/**
 * Application top navigation: brand, role-aware links, theme toggle, and
 * sign-out. Collapses into a hamburger menu on small screens.
 */
export default function AppNavbar({ email, role, home, pathname, onSignOut }: AppNavbarProps) {
  const { effectiveTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const links: NavLink[] = [
    { href: home, label: 'Dashboard' },
    { href: '/dashboard/notifications', label: 'Notifications' },
    ...(role === 'STUDENT'
      ? [
          { href: '/dashboard/student/enrollments', label: 'Enrollments' },
          { href: '/dashboard/student/courses', label: 'Courses' },
        ]
      : []),
    ...(role === 'ADMIN'
      ? [
          { href: '/dashboard/admin/questions', label: 'Questions' },
          { href: '/dashboard/admin/assessments', label: 'Assessments' },
          { href: '/dashboard/admin/enrollments', label: 'Enrollments' },
        ]
      : []),
  ];

  const linkClasses = (href: string) =>
    `rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-gold/20 text-gold font-semibold'
        : 'text-ivory/80 hover:bg-white/10 hover:text-gold'
    }`;

  return (
    <nav className="sticky top-0 z-20 border-b border-gold/25 bg-primary text-ivory shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href={home} className="font-serif text-lg font-bold tracking-wide text-gold">
          Al Nahda
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        <span className="flex-1" />

        <span className="hidden text-xs text-ivory/70 sm:inline">
          {email} <Badge tone="gold" className="ml-1">{role}</Badge>
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
          className="rounded-md border border-gold/40 px-2.5 py-1 text-sm text-gold transition-colors hover:bg-gold/15"
        >
          {effectiveTheme === 'dark' ? '☀' : '☾'}
        </button>

        <button
          type="button"
          onClick={onSignOut}
          className="rounded-md border border-gold/40 px-3 py-1 text-sm text-gold transition-colors hover:bg-gold/15"
        >
          Sign out
        </button>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded-md border border-gold/40 px-2.5 py-1 text-sm text-gold md:hidden"
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-gold/20 px-4 py-2 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClasses(link.href)}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <span className="mt-1 text-xs text-ivory/70">
            {email} <Badge tone="gold" className="ml-1">{role}</Badge>
          </span>
        </div>
      )}
    </nav>
  );
}
