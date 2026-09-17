import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationsApi } from '../api/misc.api';
import { followApi } from '../api/users.api';
import { Avatar, EmptyState, Spinner } from '../components/primitives';
import { ApiClientError } from '../lib/apiClient';
import type { AppNotification } from '../types';

const ICONS: Record<AppNotification['type'], string> = {
  LIKE: '❤️',
  COMMENT: '💬',
  MENTION: '📣',
  FOLLOW_REQUEST: '👤',
  FOLLOW_ACCEPT: '✅',
  EVENT_REMINDER: '📅',
  GROUP_INVITE: '📚',
};

const MESSAGES: Record<AppNotification['type'], string> = {
  LIKE: 'أعجب بمنشورك',
  COMMENT: 'علّق على منشورك',
  MENTION: 'أشار إليك في منشور',
  FOLLOW_REQUEST: 'أرسل لك طلب متابعة',
  FOLLOW_ACCEPT: 'قبل طلب متابعتك',
  EVENT_REMINDER: 'تذكير بفعالية قادمة',
  GROUP_INVITE: 'دعاك لمجموعة',
};

export function NotificationsPage() {
  const { t } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [resolved, setResolved] = useState<Record<string, 'accepted' | 'declined'>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi.list().then((r) => setNotifications(r.notifications));
    notificationsApi.markAllRead();
  }, []);

  async function respond(n: AppNotification, accept: boolean) {
    if (busyId) return;
    setBusyId(n.id);
    try {
      await followApi.respond(n.actor.username, accept);
      setResolved((prev) => ({ ...prev, [n.id]: accept ? 'accepted' : 'declined' }));
    } catch (err) {
      // If the request was already handled elsewhere (e.g. another tab), treat it as resolved rather than leaving a dead button.
      if (err instanceof ApiClientError) setResolved((prev) => ({ ...prev, [n.id]: accept ? 'accepted' : 'declined' }));
    } finally {
      setBusyId(null);
    }
  }

  if (notifications === null) return <div className="max-w-xl mx-auto px-4 py-6"><Spinner /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-3">
      <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{t.alerts}</h1>

      {notifications.length === 0 && <EmptyState emoji="🔔" title={t.noAlerts} />}

      {notifications.map((n) => {
        const isFollowRequest = n.type === 'FOLLOW_REQUEST';
        const decision = resolved[n.id];
        return (
          <div
            key={n.id}
            className="flex items-center gap-3 rounded-2xl p-3"
            style={{ background: n.isRead ? 'var(--card)' : 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <Link to={`/profile/${n.actor.username}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar src={n.actor.avatarUrl} name={n.actor.fullName} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  <span className="font-bold">{n.actor.fullName}</span> {MESSAGES[n.type]}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </Link>

            {isFollowRequest && !decision && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => respond(n, true)}
                  disabled={busyId === n.id}
                  className="px-3 py-1.5 rounded-full text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
                >
                  {t.acceptRequest}
                </button>
                <button
                  onClick={() => respond(n, false)}
                  disabled={busyId === n.id}
                  className="px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {t.declineRequest}
                </button>
              </div>
            )}
            {isFollowRequest && decision && (
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                {decision === 'accepted' ? `✓ ${t.acceptRequest}` : `✕ ${t.declineRequest}`}
              </span>
            )}
            {!isFollowRequest && <span className="flex-shrink-0">{ICONS[n.type]}</span>}
          </div>
        );
      })}
    </div>
  );
}
