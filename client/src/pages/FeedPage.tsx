import { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { postsApi } from '../api/posts.api';
import { PostCard } from '../components/PostCard';
import { SkeletonCard, EmptyState, ErrorBanner } from '../components/primitives';
import { ComposeBox } from '../components/ComposeBox';
import type { Post } from '../types';

export function FeedPage() {
  const { t } = useApp();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(async () => {
    try {
      const { posts: page, nextCursor: cursor } = await postsApi.getFeed();
      setPosts(page);
      setNextCursor(cursor);
    } catch {
      setError('تعذر تحميل التغذية الإخبارية. حاول تحديث الصفحة.');
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { posts: page, nextCursor: cursor } = await postsApi.getFeed(nextCursor);
      setPosts((prev) => [...(prev ?? []), ...page]);
      setNextCursor(cursor);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleCreated(post: Post) {
    setPosts((prev) => [post, ...(prev ?? [])]);
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => (prev ?? []).filter((p) => p.id !== postId));
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <ComposeBox onCreated={handleCreated} />

      {error && <ErrorBanner message={error} />}

      {posts === null && !error && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {posts?.length === 0 && (
        <EmptyState emoji="🎓" title="لا توجد منشورات بعد" sub="ابدأ بمتابعة زملائك أو انشر أول منشور لك." />
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
      ))}

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
        >
          {loadingMore ? '...' : t.seeAll}
        </button>
      )}
    </div>
  );
}
