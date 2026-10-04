'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiErrorMessage, fetchNotifications, markNotificationRead } from '@/lib/api';
import type { Notification } from '@/lib/types';

const POLL_INTERVAL_MS = 15_000;

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

  return (
    <div className="card">
      <h2>
        Notifications {unread > 0 && <span className="badge err">{unread} unread</span>}
      </h2>

      {error && <div className="error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="muted">No notifications yet. This refreshes every 15 seconds.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((n) => (
          <li
            key={n.id}
            style={{
              padding: '10px 0',
              borderBottom: '1px solid #e8ebee',
              background: n.isRead ? 'transparent' : '#f5f9ff',
            }}
          >
            <div>{n.message}</div>
            <div className="row" style={{ marginTop: 6 }}>
              <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
              {!n.isRead && (
                <button type="button" onClick={() => void markRead(n.id)}>
                  Mark as read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
