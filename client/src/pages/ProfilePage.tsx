import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usersApi, followApi } from '../api/users.api';
import { postsApi } from '../api/posts.api';
import { PostCard } from '../components/PostCard';
import { FollowListModal } from '../components/FollowListModal';
import { Avatar, VerifiedBadge, SkeletonCard, EmptyState, ErrorBanner } from '../components/primitives';
import type { PublicProfile, Post } from '../types';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { t } = useApp();
  const { user: viewer, refreshUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [listModal, setListModal] = useState<'followers' | 'following' | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    setError(null);
    try {
      const [{ profile: p }, { posts: userPosts }] = await Promise.all([
        usersApi.getProfile(username),
        postsApi.getUserPosts(username),
      ]);
      setProfile(p);
      setPosts(userPosts);
    } catch {
      setError('تعذر العثور على هذا المستخدم.');
    }
  }, [username]);

  useEffect(() => {
    setProfile(null);
    setPosts(null);
    load();
  }, [load]);

  async function handleFollowToggle() {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    try {
      if (profile.isFollowing) {
        await followApi.unfollow(profile.username);
        setProfile({ ...profile, isFollowing: false, followStatus: null });
      } else {
        const { status } = await followApi.follow(profile.username);
        setProfile({ ...profile, isFollowing: status === 'ACCEPTED', followStatus: status });
      }
      if (viewer?.username === username) await refreshUser();
    } finally {
      setFollowBusy(false);
    }
  }

  if (error) return <div className="max-w-xl mx-auto px-4 py-6"><ErrorBanner message={error} /></div>;
  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="h-28" style={{ background: profile.coverImageUrl ? `url(${profile.coverImageUrl}) center/cover` : 'linear-gradient(135deg,#6d5ef5,#a855f7)' }} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <Avatar src={profile.avatarUrl} name={profile.fullName} size={80} />
            {profile.isOwnProfile ? (
              <Link
                to="/settings"
                className="px-5 py-2 rounded-full text-sm font-bold"
                style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
              >
                {t.editProfileBtn}
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={`/messages/${profile.username}`}
                  className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {t.messageBtn}
                </Link>
                <button
                  onClick={handleFollowToggle}
                  disabled={followBusy}
                  className="px-5 py-2 rounded-full text-sm font-bold"
                  style={
                    profile.isFollowing
                      ? { background: 'var(--muted)', color: 'var(--foreground)' }
                      : { background: 'linear-gradient(135deg,#6d5ef5,#a855f7)', color: '#fff' }
                  }
                >
                  {profile.followStatus === 'PENDING' ? '...' : profile.isFollowing ? t.followingBtn : t.followBtn}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <h1 className="font-extrabold text-lg" style={{ color: 'var(--foreground)' }}>
              {profile.fullName}
            </h1>
            {profile.isVerified && <VerifiedBadge />}
          </div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            @{profile.username} · {profile.universityName}
          </p>
          {profile.bio && <p className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>{profile.bio}</p>}

          <div className="flex items-center gap-5 mt-4 text-sm">
            <Stat label={t.posts} value={profile._count.posts} />
            <button onClick={() => setListModal('followers')}>
              <Stat label={t.followers} value={profile._count.followers} />
            </button>
            <button onClick={() => setListModal('following')}>
              <Stat label={t.following} value={profile._count.following} />
            </button>
          </div>
        </div>
      </div>

      {listModal && <FollowListModal username={profile.username} kind={listModal} onClose={() => setListModal(null)} />}

      {profile.isPrivate && !profile.isFollowing && !profile.isOwnProfile ? (
        <EmptyState emoji="🔒" title="هذا الحساب خاص" sub="تابع هذا المستخدم لرؤية منشوراته." />
      ) : (
        <>
          {posts?.length === 0 && <EmptyState emoji="📝" title="لا توجد منشورات بعد" />}
          {posts?.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => (prev ?? []).filter((p) => p.id !== id))} />
          ))}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="font-extrabold" style={{ color: 'var(--foreground)' }}>{value}</span>{' '}
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
    </div>
  );
}
