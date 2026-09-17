import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { postsApi } from '../api/posts.api';
import { Avatar, VerifiedBadge } from './primitives';
import type { Post, Comment } from '../types';

/** Small, dependency-free relative-time formatter (no need for a date library for this scale). */
function timeAgo(iso: string, lang: 'en' | 'ar'): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return lang === 'ar' ? 'الآن' : 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return lang === 'ar' ? `قبل ${minutes} د` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'ar' ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return lang === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');
}

export function PostCard({ post, onDeleted }: { post: Post; onDeleted?: (postId: string) => void }) {
  const { t, lang } = useApp();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLikedByViewer ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);

  const canDelete = user && (user.id === post.authorId || user.role === 'ADMIN' || user.role === 'MODERATOR');

  async function handleLike() {
    setLiked((v) => !v);
    setLikesCount((c) => c + (liked ? -1 : 1));
    try {
      const result = await postsApi.toggleLike(post.id);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch {
      setLiked((v) => !v); // revert optimistic update on failure
      setLikesCount(post.likesCount);
    }
  }

  async function loadComments() {
    setCommentsOpen((v) => !v);
    if (comments === null) {
      const { comments: list } = await postsApi.getComments(post.id);
      setComments(list);
    }
  }

  async function submitComment() {
    if (!commentText.trim() || busy) return;
    setBusy(true);
    try {
      const { comment } = await postsApi.addComment(post.id, commentText.trim());
      setComments((prev) => [...(prev ?? []), comment]);
      setCommentText('');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    await postsApi.remove(post.id);
    onDeleted?.(post.id);
  }

  return (
    <article className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <Link to={`/profile/${post.author.username}`}>
          <Avatar src={post.author.avatarUrl} name={post.author.fullName} size={44} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/profile/${post.author.username}`} className="font-bold text-sm hover:underline" style={{ color: 'var(--foreground)' }}>
              {post.author.fullName}
            </Link>
            {post.author.isVerified && <VerifiedBadge />}
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              @{post.author.username} · {timeAgo(post.createdAt, lang)}
            </span>
          </div>

          <p className="mt-2 text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>
            {post.content}
          </p>

          {post.mediaUrls.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.mediaUrls.map((url) => (
                <img key={url} src={url} alt="" loading="lazy" className="rounded-xl w-full object-cover max-h-96" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-5 mt-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <button onClick={handleLike} className="flex items-center gap-1.5 font-medium" style={{ color: liked ? '#ef4444' : undefined }}>
              {liked ? '❤️' : '🤍'} {likesCount}
            </button>
            <button onClick={loadComments} className="flex items-center gap-1.5 font-medium">
              💬 {post.commentsCount}
            </button>
            {canDelete && (
              <button onClick={handleDelete} className="ms-auto font-medium" style={{ color: '#ef4444' }}>
                {t.deletePost}
              </button>
            )}
          </div>

          {commentsOpen && (
            <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              {comments === null && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>...</p>}
              {comments?.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <Avatar src={c.author.avatarUrl} name={c.author.fullName} size={28} />
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'var(--muted)' }}>
                    <span className="font-semibold text-xs">{c.author.fullName}</span>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder={t.addComment}
                  className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                />
                <button onClick={submitComment} disabled={busy} className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                  {t.sendComment}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
