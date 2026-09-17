import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { groupsApi, eventsApi } from '../api/misc.api';
import { postsApi } from '../api/posts.api';
import { usersApi } from '../api/users.api';
import { PostCard } from '../components/PostCard';
import { ComposeBox } from '../components/ComposeBox';
import { Avatar, VerifiedBadge, Spinner, EmptyState, ErrorBanner, SkeletonCard } from '../components/primitives';
import { ApiClientError } from '../lib/apiClient';
import type { StudyGroup, GroupMember, CampusEvent, Post } from '../types';

type Tab = 'posts' | 'members' | 'events';

function GroupAvatar({ group, size = 72 }: { group: StudyGroup; size?: number }) {
  const initials = group.name.trim().slice(0, 1).toUpperCase() || '?';
  return group.avatarUrl ? (
    <img
      src={group.avatarUrl}
      alt=""
      className="rounded-2xl object-cover flex-shrink-0"
      style={{ width: size, height: size, border: '3px solid var(--background)' }}
    />
  ) : (
    <div
      className="rounded-2xl flex items-center justify-center font-extrabold text-white flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'linear-gradient(135deg,#6d5ef5,#a855f7)', border: '3px solid var(--background)' }}
    >
      {initials}
    </div>
  );
}

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { t, lang, showToast } = useApp();
  const navigate = useNavigate();

  const [group, setGroup] = useState<(StudyGroup & { myRole: string | null }) | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [postsLocked, setPostsLocked] = useState(false);
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [membersLocked, setMembersLocked] = useState(false);
  const [events, setEvents] = useState<CampusEvent[] | null>(null);
  const [eventsLocked, setEventsLocked] = useState(false);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [evStart, setEvStart] = useState('');
  const [evEnd, setEvEnd] = useState('');
  const [evCapacity, setEvCapacity] = useState(20);

  const isMember = Boolean(group?.myRole);
  const canManage = group?.myRole === 'ADMIN' || group?.myRole === 'MODERATOR';

  const loadGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const { group: g } = await groupsApi.getOne(groupId);
      setGroup(g);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) setNotFound(true);
      else setLoadError('تعذر تحميل المجموعة.');
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  useEffect(() => {
    if (!groupId || !group) return;
    if (tab === 'posts' && posts === null) {
      postsApi
        .getGroupPosts(groupId)
        .then(({ posts: list }) => setPosts(list))
        .catch((err) => {
          if (err instanceof ApiClientError && err.status === 403) setPostsLocked(true);
        });
    }
    if (tab === 'members' && members === null) {
      groupsApi
        .members(groupId)
        .then(({ members: list }) => setMembers(list))
        .catch((err) => {
          if (err instanceof ApiClientError && err.status === 403) setMembersLocked(true);
        });
    }
    if (tab === 'events' && events === null) {
      eventsApi
        .list(groupId)
        .then(({ events: list }) => setEvents(list))
        .catch((err) => {
          if (err instanceof ApiClientError && err.status === 403) setEventsLocked(true);
        });
    }
  }, [tab, groupId, group, posts, members, events]);

  async function handleJoin() {
    if (!groupId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await groupsApi.join(groupId);
      await loadGroup();
      showToast(t.joined);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.error : 'تعذر الانضمام.');
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!groupId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await groupsApi.leave(groupId);
      navigate('/groups');
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.error : 'تعذر مغادرة المجموعة.');
      setBusy(false);
    }
  }

  async function handleAddMember() {
    if (!groupId || !addMemberUsername.trim() || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      // The add-member endpoint takes a user id; we resolve the typed
      // username to an id via the public profile endpoint first.
      const { profile } = await usersApi.getProfile(addMemberUsername.trim().replace(/^@/, ''));
      await groupsApi.addMember(groupId, profile.id);
      setAddMemberUsername('');
      setMembers(null);
      await loadGroup();
      showToast(t.saved);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.error : 'تعذر إضافة العضو.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateEvent() {
    if (!groupId || busy) return;
    if (!evTitle.trim() || !evDescription.trim() || !evLocation.trim() || !evStart || !evEnd) return;
    setBusy(true);
    setActionError(null);
    try {
      await eventsApi.create({
        groupId,
        title: evTitle.trim(),
        description: evDescription.trim(),
        location: evLocation.trim(),
        startTime: new Date(evStart).toISOString(),
        endTime: new Date(evEnd).toISOString(),
        capacity: evCapacity,
      });
      setEvTitle('');
      setEvDescription('');
      setEvLocation('');
      setEvStart('');
      setEvEnd('');
      setEvCapacity(20);
      setShowCreateEvent(false);
      setEvents(null);
      showToast(t.saved);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.error : 'تعذر إنشاء الفعالية.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRsvp(eventId: string) {
    setActionError(null);
    try {
      await eventsApi.rsvp(eventId);
      setEvents(null);
      const { events: list } = await eventsApi.list(groupId);
      setEvents(list);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.error : 'تعذر التسجيل في الفعالية.');
    }
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <EmptyState emoji="🔍" title={t.groupNotFound} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <ErrorBanner message={loadError} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Cover + header */}
      <div className="h-32 sm:h-40" style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7,#3b82f6)' }} />
      <div className="px-4 -mt-10">
        <div className="flex items-end justify-between">
          <GroupAvatar group={group} />
          <div className="flex gap-2 pb-1">
            {isMember ? (
              <button
                onClick={handleLeave}
                disabled={busy}
                className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
                style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
              >
                {busy ? <Spinner size={14} /> : t.leaveGroupBtn}
              </button>
            ) : group.isPrivate ? (
              <span className="px-4 py-2 rounded-full text-xs font-semibold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                🔒 {t.privateGroupJoinNote}
              </span>
            ) : (
              <button
                onClick={handleJoin}
                disabled={busy}
                className="px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
              >
                {busy ? <Spinner size={14} /> : t.join}
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>{group.name}</h1>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            {group.isPrivate ? `🔒 ${t.groupPrivate}` : `🌐 ${t.groupPublic}`}
          </span>
        </div>
        {group.description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>{group.description}</p>
        )}
        <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {group.memberCount} {t.membersCount}
        </p>

        {actionError && (
          <div className="mt-3">
            <ErrorBanner message={actionError} />
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex gap-1 rounded-xl p-1" style={{ background: 'var(--muted)' }}>
          {(['posts', 'members', 'events'] as Tab[]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{
                background: tab === tb ? 'var(--card)' : 'transparent',
                color: tab === tb ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              {tb === 'posts' ? t.postsTab : tb === 'members' ? t.membersTab : t.events}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {tab === 'posts' && (
            postsLocked ? (
              <EmptyState emoji="🔒" title={t.privateGroupLocked} sub={t.privateGroupJoinNote} />
            ) : (
              <>
                {isMember && (
                  <ComposeBox
                    groupId={groupId}
                    placeholder={t.groupPostPlaceholder}
                    onCreated={(p) => setPosts((prev) => [p, ...(prev ?? [])])}
                  />
                )}
                {posts === null && (
                  <div className="space-y-3">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                )}
                {posts?.length === 0 && <EmptyState emoji="📝" title={t.postsEmptyGroup} />}
                {posts?.map((post) => (
                  <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => (prev ?? []).filter((p) => p.id !== id))} />
                ))}
              </>
            )
          )}

          {tab === 'members' && (
            membersLocked ? (
              <EmptyState emoji="🔒" title={t.privateGroupLocked} sub={t.privateGroupJoinNote} />
            ) : (
              <>
                {canManage && (
                  <div className="rounded-2xl p-3 flex gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <input
                      value={addMemberUsername}
                      onChange={(e) => setAddMemberUsername(e.target.value)}
                      placeholder={t.addMemberPlaceholder}
                      className="flex-1 py-2 px-3 rounded-xl outline-none text-sm"
                      style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={busy || !addMemberUsername.trim()}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
                    >
                      {busy ? <Spinner size={14} /> : t.addMemberBtn}
                    </button>
                  </div>
                )}
                {members === null && <Spinner />}
                {members?.length === 0 && <EmptyState emoji="👥" title={t.membersEmpty} />}
                {members?.map((m) => (
                  <Link
                    key={m.id}
                    to={`/profile/${m.user.username}`}
                    className="rounded-2xl p-3 flex items-center gap-3"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                  >
                    <Avatar src={m.user.avatarUrl} name={m.user.fullName} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--foreground)' }}>{m.user.fullName}</p>
                        {m.user.isVerified && <VerifiedBadge />}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>@{m.user.username}</p>
                    </div>
                    <span
                      className="text-[11px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {m.role === 'ADMIN' ? t.roleAdmin : m.role === 'MODERATOR' ? t.roleModerator : t.roleMember}
                    </span>
                  </Link>
                ))}
              </>
            )
          )}

          {tab === 'events' && (
            eventsLocked ? (
              <EmptyState emoji="🔒" title={t.privateGroupLocked} sub={t.privateGroupJoinNote} />
            ) : (
              <>
                {canManage && (
                  <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    {!showCreateEvent ? (
                      <button
                        onClick={() => setShowCreateEvent(true)}
                        className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
                      >
                        + {t.createEventBtn}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          value={evTitle}
                          onChange={(e) => setEvTitle(e.target.value)}
                          placeholder={t.eventTitleLabel}
                          className="w-full py-2 px-3 rounded-xl outline-none text-sm"
                          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                        />
                        <textarea
                          value={evDescription}
                          onChange={(e) => setEvDescription(e.target.value)}
                          placeholder={t.eventDescLabel}
                          rows={2}
                          className="w-full py-2 px-3 rounded-xl outline-none text-sm resize-none"
                          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                        />
                        <input
                          value={evLocation}
                          onChange={(e) => setEvLocation(e.target.value)}
                          placeholder={t.eventLocationLabel}
                          className="w-full py-2 px-3 rounded-xl outline-none text-sm"
                          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {t.eventStartLabel}
                            <input
                              type="datetime-local"
                              value={evStart}
                              onChange={(e) => setEvStart(e.target.value)}
                              className="w-full mt-1 py-2 px-3 rounded-xl outline-none text-sm"
                              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                            />
                          </label>
                          <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {t.eventEndLabel}
                            <input
                              type="datetime-local"
                              value={evEnd}
                              onChange={(e) => setEvEnd(e.target.value)}
                              className="w-full mt-1 py-2 px-3 rounded-xl outline-none text-sm"
                              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                            />
                          </label>
                        </div>
                        <label className="text-xs block" style={{ color: 'var(--muted-foreground)' }}>
                          {t.eventCapacityLabel}
                          <input
                            type="number"
                            min={1}
                            max={5000}
                            value={evCapacity}
                            onChange={(e) => setEvCapacity(Number(e.target.value))}
                            className="w-full mt-1 py-2 px-3 rounded-xl outline-none text-sm"
                            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                          />
                        </label>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => setShowCreateEvent(false)} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                            {t.close}
                          </button>
                          <button
                            onClick={handleCreateEvent}
                            disabled={busy}
                            className="px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
                          >
                            {busy ? <Spinner size={14} /> : t.create}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {events === null && <Spinner />}
                {events?.length === 0 && <EmptyState emoji="📅" title="لا توجد فعاليات قادمة" />}
                {events?.map((e) => {
                  const full = e.filledSeats >= e.capacity;
                  return (
                    <div key={e.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <div className="flex-1">
                        <p className="font-bold" style={{ color: 'var(--foreground)' }}>{e.title}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(e.startTime).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')} · {e.location}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {e.filledSeats}/{e.capacity} {t.attending}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRsvp(e.id)}
                        disabled={full}
                        className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)', color: '#fff' }}
                      >
                        {full ? '—' : t.rsvp}
                      </button>
                    </div>
                  );
                })}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
