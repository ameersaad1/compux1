import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { adminApi, type AdminUserRow, type VerificationRequest, type AdminPostRow } from '../api/admin.api';
import { Avatar, Spinner, EmptyState } from '../components/primitives';

type Tab = 'stats' | 'users' | 'verify' | 'posts';

export function AdminPanel() {
  const { t } = useApp();
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{t.adminPanel}</h1>

      <div className="flex gap-2">
        {(
          [
            ['stats', t.adminStats],
            ['users', t.adminUsers],
            ['verify', t.adminVerify],
            ['posts', t.adminPosts],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={tab === id ? { background: 'var(--primary)', color: '#fff' } : { background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'verify' && <VerifyTab />}
      {tab === 'posts' && <PostsTab />}
    </div>
  );
}

function StatsTab() {
  const { t } = useApp();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminApi.stats>> | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats);
  }, []);

  if (!stats) return <Spinner />;

  const cards: [string, number][] = [
    [t.totalUsers, stats.totalUsers],
    [t.totalPosts, stats.totalPosts],
    [t.activeToday, stats.activeToday],
    [t.pendingVerify, stats.pendingVerify],
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const { t } = useApp();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const res = await adminApi.listUsers(query, page);
    setUsers(res.users);
    setTotal(res.total);
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(u: AdminUserRow) {
    const { user } = await adminApi.setBanned(u.id, !u.isBanned);
    setUsers((prev) => prev?.map((x) => (x.id === user.id ? user : x)) ?? null);
  }

  async function toggleAdmin(u: AdminUserRow) {
    const nextRole = u.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    const { user } = await adminApi.setRole(u.id, nextRole);
    setUsers((prev) => prev?.map((x) => (x.id === user.id ? user : x)) ?? null);
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        placeholder={t.searchPlaceholder}
        className="w-full py-2.5 px-4 rounded-xl outline-none"
        style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
      />

      {users === null && <Spinner />}
      {users?.length === 0 && <EmptyState emoji="🔍" title={t.noResults} />}

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {users?.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
            <Avatar src={u.avatarUrl} name={u.fullName} size={36} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                {u.fullName} <span style={{ color: 'var(--muted-foreground)' }}>@{u.username}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{u.email} · {u.role}</p>
            </div>
            <button onClick={() => toggleAdmin(u)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
              {u.role === 'ADMIN' ? t.removeAdmin : t.makeAdmin}
            </button>
            <button
              onClick={() => toggleBan(u)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: u.isBanned ? 'var(--muted)' : 'rgba(239,68,68,0.1)', color: u.isBanned ? 'var(--foreground)' : '#ef4444' }}
            >
              {u.isBanned ? t.unban : t.ban}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">←</button>
        <span>{page} / {Math.max(1, Math.ceil(total / 20))}</span>
        <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">→</button>
      </div>
    </div>
  );
}

function PostsTab() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<AdminPostRow[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await adminApi.listPosts(query, page);
    setPosts(res.posts);
    setTotal(res.total);
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(postId: string) {
    if (!window.confirm(t.confirmDeletePost)) return;
    setDeletingId(postId);
    try {
      await adminApi.deletePost(postId);
      setPosts((prev) => prev?.filter((p) => p.id !== postId) ?? null);
      setTotal((n) => Math.max(0, n - 1));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        placeholder={t.searchPlaceholder}
        className="w-full py-2.5 px-4 rounded-xl outline-none"
        style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
      />

      {posts === null && <Spinner />}
      {posts?.length === 0 && <EmptyState emoji="📝" title={t.noResults} />}

      <div className="space-y-3">
        {posts?.map((p) => (
          <div key={p.id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-start gap-3">
              <Link to={`/profile/${p.author.username}`}>
                <Avatar src={p.author.avatarUrl} name={p.author.fullName} size={36} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link to={`/profile/${p.author.username}`} className="font-semibold text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
                    {p.author.fullName}
                  </Link>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>@{p.author.username}</span>
                  {p.group && (
                    <Link to={`/groups/${p.group.id}`} className="text-xs font-semibold px-2 py-0.5 rounded-full hover:underline" style={{ background: 'var(--muted)', color: 'var(--primary)' }}>
                      {p.group.name}
                    </Link>
                  )}
                </div>
                <p className="text-sm mt-1.5 whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>{p.content}</p>
                {p.mediaUrls.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto">
                    {p.mediaUrls.map((url) => (
                      <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(p.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')} · ❤️ {p._count.likes} · 💬 {p._count.comments}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                className="text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
              >
                {deletingId === p.id ? <Spinner size={12} /> : t.deletePostBtn}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="disabled:opacity-40">←</button>
        <span>{page} / {Math.max(1, Math.ceil(total / 20))}</span>
        <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="disabled:opacity-40">→</button>
      </div>
    </div>
  );
}

function VerifyTab() {
  const { t, showToast } = useApp();
  const [requests, setRequests] = useState<VerificationRequest[] | null>(null);

  const load = useCallback(async () => {
    const { requests: list } = await adminApi.verificationRequests();
    setRequests(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, approve: boolean) {
    await adminApi.decideVerification(id, approve);
    setRequests((prev) => prev?.filter((r) => r.id !== id) ?? null);
    showToast(approve ? t.approve : t.reject);
  }

  if (requests === null) return <Spinner />;
  if (requests.length === 0) return <EmptyState emoji="✅" title={t.noResults} />;

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Avatar src={r.user.avatarUrl} name={r.user.fullName} size={40} />
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{r.user.fullName} <span style={{ color: 'var(--muted-foreground)' }}>@{r.user.username}</span></p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.user.universityName}</p>
          </div>
          <button onClick={() => decide(r.id, true)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: '#22c55e' }}>{t.approve}</button>
          <button onClick={() => decide(r.id, false)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: '#ef4444' }}>{t.reject}</button>
        </div>
      ))}
    </div>
  );
}
