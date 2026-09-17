import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { followApi } from '../api/users.api';
import { Avatar, VerifiedBadge, Spinner, EmptyState } from './primitives';
import { ApiClientError } from '../lib/apiClient';
import type { PublicUser } from '../types';

export function FollowListModal({
  username,
  kind,
  onClose,
}: {
  username: string;
  kind: 'followers' | 'following';
  onClose: () => void;
}) {
  const { t } = useApp();
  const [list, setList] = useState<PublicUser[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const request = kind === 'followers' ? followApi.followers(username) : followApi.following(username);
    request
      .then((r) => setList(kind === 'followers' ? (r as { followers: PublicUser[] }).followers : (r as { following: PublicUser[] }).following))
      .catch((err) => {
        if (err instanceof ApiClientError && err.status === 403) setLocked(true);
        else setError(true);
      });
  }, [username, kind]);

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
            {kind === 'followers' ? t.followers : t.following}
          </h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--muted-foreground)' }}>
            &times;
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {locked && (
            <div className="p-6">
              <EmptyState emoji="🔒" title={t.privateGroupLocked} />
            </div>
          )}
          {error && (
            <div className="p-6">
              <EmptyState emoji="⚠️" title={t.noResults} />
            </div>
          )}
          {!locked && !error && list === null && <div className="p-6"><Spinner /></div>}
          {!locked && list?.length === 0 && (
            <div className="p-6">
              <EmptyState emoji="👤" title={t.noResults} />
            </div>
          )}
          {list?.map((u) => (
            <Link
              key={u.id}
              to={`/profile/${u.username}`}
              onClick={onClose}
              className="flex items-center gap-3 px-5 py-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <Avatar src={u.avatarUrl} name={u.fullName} size={40} />
              <div className="min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1 truncate" style={{ color: 'var(--foreground)' }}>
                  {u.fullName} {u.isVerified && <VerifiedBadge size={12} />}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
