'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/feedback/EmptyState';
import SkeletonLoader from '@/components/feedback/SkeletonLoader';
import ErrorCard from '@/components/feedback/ErrorCard';
import { apiErrorMessage, fetchNotifications, markNotificationRead } from '@/lib/api';
import type { Notification } from '@/lib/types';

const POLL_INTERVAL_MS = 15_000;

/** Group heading buckets for the notification center. */
function bucketFor(n: Notification): 'Unread' | 'Earlier' {
  return n.isRead ? 'Earlier' : 'Unread';
}

/** Polling feed used by every role. */
export default function NotificationsFeed() {
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setItems(await fetchNotifications());
      setError(null);
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load notifications'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not update the notification'));
    }
  };

  const unread = items.filter((n) => !n.isRead).length;
  const unreadItems = items.filter((n) => bucketFor(n) === 'Unread');
  const earlierItems = items.filter((n) => bucketFor(n) === 'Earlier');

  const renderRow = (n: Notification) => (
    <li
      key={n.id}
      className={`flex flex-col gap-2 rounded-lg border px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
        n.isRead
          ? 'border-sandstone/60 bg-surface dark:border-gold/15 dark:bg-primary/40'
          : 'border-gold/40 bg-gold/5 dark:border-gold/40 dark:bg-gold/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            n.isRead
              ? 'bg-sandstone/50 text-slate-500 dark:bg-white/10 dark:text-gold-light/70'
              : 'bg-teal/15 text-teal dark:bg-teal/20 dark:text-gold-light'
          }`}
        >
          {n.isRead ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </span>
        <p
          className={`m-0 text-sm ${
            n.isRead
              ? 'text-slate-600 dark:text-gold-light/70'
              : 'font-medium text-charcoal dark:text-ivory'
          }`}
        >
          {n.message}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <span className="text-xs text-slate-400 dark:text-gold-light/50">
          {new Date(n.createdAt).toLocaleString()}
        </span>
        {!n.isRead && (
          <Button size="sm" variant="ghost" onClick={() => void markRead(n.id)}>
            <Check className="h-3.5 w-3.5" />
            Mark read
          </Button>
        )}
      </div>
    </li>
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-primary dark:text-gold">
            Notifications
          </h1>
          <p className="m-0 text-sm text-slate-500 dark:text-gold-light/70">
            Updates about your enrollments, fees, and account. Refreshes every 15 seconds.
          </p>
        </div>
        {unread > 0 && <Badge tone="gold">{unread} unread</Badge>}
      </header>

      {error && <ErrorCard message={error} />}

      {loading ? (
        <SkeletonLoader rows={4} height="h-16" />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="No notifications yet"
            description="When there's news about your enrollments, fees, or account, it will appear here."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {unreadItems.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gold-light/70">
                Unread
              </h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">{unreadItems.map(renderRow)}</ul>
            </section>
          )}

          {earlierItems.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gold-light/70">
                Earlier
              </h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">{earlierItems.map(renderRow)}</ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
