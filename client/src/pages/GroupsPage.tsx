import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { groupsApi } from '../api/misc.api';
import { EmptyState, Spinner, ErrorBanner, Toggle } from '../components/primitives';
import { ApiClientError } from '../lib/apiClient';
import type { StudyGroup } from '../types';

function GroupAvatar({ group, size = 52 }: { group: StudyGroup; size?: number }) {
  const initials = group.name.trim().slice(0, 1).toUpperCase() || '?';
  return group.avatarUrl ? (
    <img src={group.avatarUrl} alt="" className="rounded-2xl object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-2xl flex items-center justify-center font-extrabold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
    >
      {initials}
    </div>
  );
}

export function GroupsPage() {
  const { t, showToast } = useApp();
  const [groups, setGroups] = useState<StudyGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [joiningId, setJoiningId] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const { groups: list } = await groupsApi.list();
      setGroups(list);
    } catch {
      setError('تعذر تحميل المجموعات.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      await groupsApi.create(name.trim(), description.trim(), isPrivate);
      setName('');
      setDescription('');
      setIsPrivate(false);
      setShowCreate(false);
      await load();
      showToast(t.saved);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error : 'تعذر إنشاء المجموعة.');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin(groupId: string, groupIsPrivate: boolean) {
    if (groupIsPrivate) return; // private groups require an admin invite - see GroupDetailPage
    setJoiningId(groupId);
    setError(null);
    try {
      await groupsApi.join(groupId);
      await load();
      showToast(t.joined);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.error : 'تعذر الانضمام للمجموعة.');
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{t.studyGroupsLabel}</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2 rounded-full text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
        >
          + {t.create}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {showCreate && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.groupNamePlaceholder}
            maxLength={100}
            className="w-full py-2.5 px-4 rounded-xl outline-none text-sm"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.groupDescPlaceholder}
            rows={2}
            maxLength={1000}
            className="w-full py-2.5 px-4 rounded-xl outline-none text-sm resize-none"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              🔒 {t.createGroupPrivateToggle}
            </span>
            <Toggle checked={isPrivate} onChange={() => setIsPrivate((v) => !v)} label={t.createGroupPrivateToggle} />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
              {t.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
            >
              {creating ? <Spinner size={14} /> : t.create}
            </button>
          </div>
        </div>
      )}

      {groups === null && <Spinner />}
      {groups?.length === 0 && <EmptyState emoji="📚" title="لا توجد مجموعات بعد" sub="أنشئ أول مجموعة دراسية." />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups?.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="rounded-2xl p-4 flex flex-col gap-3 transition-transform hover:-translate-y-0.5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-3">
              <GroupAvatar group={g} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{g.name}</p>
                  {g.isPrivate && <span title={t.groupPrivate}>🔒</span>}
                </div>
                {g.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{g.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 me-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (g.memberCount / g.maxMembers) * 100)}%`,
                      background: 'linear-gradient(135deg,#6d5ef5,#a855f7)',
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {g.memberCount} / {g.maxMembers} {t.membersCount}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleJoin(g.id, g.isPrivate);
                }}
                disabled={joiningId === g.id}
                className="px-4 py-2 rounded-full text-xs font-bold flex-shrink-0 disabled:opacity-50"
                style={
                  g.isPrivate
                    ? { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                    : { background: 'var(--muted)', color: 'var(--foreground)' }
                }
              >
                {joiningId === g.id ? <Spinner size={12} /> : g.isPrivate ? `🔒 ${t.groupPrivate}` : t.join}
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
