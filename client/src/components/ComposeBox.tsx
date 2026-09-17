import { useRef, useState, type ChangeEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { postsApi } from '../api/posts.api';
import { uploadsApi } from '../api/misc.api';
import { Avatar, Spinner } from './primitives';
import type { Post } from '../types';

export function ComposeBox({ onCreated, groupId, placeholder }: { onCreated: (post: Post) => void; groupId?: string; placeholder?: string }) {
  const { t } = useApp();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadsApi.uploadFile(file);
      setMediaUrls((prev) => [...prev, url]);
    } catch {
      // Silently ignore - the presign endpoint reports S3 misconfiguration server-side.
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function submit() {
    if ((!content.trim() && mediaUrls.length === 0) || posting) return;
    setPosting(true);
    try {
      const { post } = await postsApi.create(content.trim(), mediaUrls, groupId);
      onCreated(post);
      setContent('');
      setMediaUrls([]);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <Avatar src={user.avatarUrl} name={user.fullName} size={40} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder ?? t.whatsOnMind}
            rows={2}
            maxLength={3000}
            className="w-full resize-none outline-none text-sm bg-transparent"
            style={{ color: 'var(--foreground)' }}
          />
          {mediaUrls.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {mediaUrls.map((url) => (
                <img key={url} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {uploading ? <Spinner size={14} /> : t.photo}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={submit}
              disabled={posting || (!content.trim() && mediaUrls.length === 0)}
              className="px-5 py-2 rounded-full text-sm font-bold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6d5ef5,#a855f7)' }}
            >
              {posting ? <Spinner size={14} /> : t.post}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
