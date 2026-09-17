import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { usersApi } from '../api/users.api';
import { Avatar, VerifiedBadge, Spinner } from './primitives';
import type { PublicUser } from '../types';

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { t } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicUser[] | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const id = setTimeout(() => {
      usersApi.search(query.trim()).then((r) => setResults(r.results));
    }, 300); // debounce so every keystroke doesn't hit the API
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full px-5 py-4 text-sm outline-none bg-transparent"
          style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--border)' }}
        />
        <div className="max-h-80 overflow-y-auto">
          {query.trim().length >= 2 && results === null && <div className="p-4"><Spinner /></div>}
          {results?.length === 0 && <p className="p-4 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>{t.noResults}</p>}
          {results?.map((u) => (
            <Link key={u.id} to={`/profile/${u.username}`} onClick={onClose} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <Avatar src={u.avatarUrl} name={u.fullName} size={36} />
              <div>
                <p className="font-semibold text-sm flex items-center gap-1" style={{ color: 'var(--foreground)' }}>
                  {u.fullName} {u.isVerified && <VerifiedBadge size={12} />}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
