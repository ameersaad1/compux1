import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { eventsApi } from '../api/misc.api';
import { EmptyState, Spinner, ErrorBanner } from '../components/primitives';
import { ApiClientError } from '../lib/apiClient';
import type { CampusEvent } from '../types';

export function EventsPage() {
  const { t, lang } = useApp();
  const [events, setEvents] = useState<CampusEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const { events: list } = await eventsApi.list();
      setEvents(list);
    } catch {
      setError('تعذر تحميل الفعاليات.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRsvp(eventId: string) {
    setError(null);
    setRsvpingId(eventId);
    try {
      await eventsApi.rsvp(eventId);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error : 'تعذر إتمام العملية.');
    } finally {
      setRsvpingId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{t.upcomingEvents}</h1>

      {error && <ErrorBanner message={error} />}
      {events === null && !error && <Spinner />}
      {events?.length === 0 && <EmptyState emoji="📅" title="لا توجد فعاليات قادمة" sub="انضم لمجموعة دراسية لترى فعالياتها هنا." />}

      {events?.map((e) => {
        const full = e.filledSeats >= e.capacity;
        const percentFilled = Math.min(100, Math.round((e.filledSeats / e.capacity) * 100));
        return (
          <div key={e.id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold"
                style={{ background: 'var(--muted)', color: 'var(--primary)' }}
              >
                <span className="text-[10px] uppercase leading-none">
                  {new Date(e.startTime).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' })}
                </span>
                <span className="text-lg leading-none mt-0.5">{new Date(e.startTime).getDate()}</span>
              </div>

              <div className="flex-1 min-w-0">
                {e.group && (
                  <Link to={`/groups/${e.group.id}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
                    {e.group.name}
                  </Link>
                )}
                <p className="font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>{e.title}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(e.startTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')} · {e.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[140px]" style={{ background: 'var(--muted)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percentFilled}%`, background: full ? '#ef4444' : 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
                    />
                  </div>
                  <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                    {e.filledSeats}/{e.capacity} {t.attending}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleRsvp(e.id)}
                disabled={full || rsvpingId === e.id}
                className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)', color: '#fff' }}
              >
                {rsvpingId === e.id ? <Spinner size={14} /> : full ? '—' : t.rsvp}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
