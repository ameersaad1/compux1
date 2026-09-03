
import { useState } from "react";
import { useApp } from "../store";
import { Av, VerBadge } from "./primitives";
import { LightboxModal } from "./modals/LightboxModal";
import { CommentsModal } from "./modals/CommentsModal";
import { PostOptionsMenu } from "./modals/PostOptionsMenu";
import type { Post } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// POST CARD
// ═══════════════════════════════════════════════════════════════════════════════
export function RichText({ content }: { content: string }) {
  const { setActiveHashtag, setView } = useApp();
  return (
    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>
      {content.split(/(#\w+)/g).map((part, i) =>
        part.startsWith("#") ? (
          <button key={i} className="font-semibold hover:underline" style={{ color: "#7c3aed" }}
            onClick={() => { setActiveHashtag(part.slice(1)); setView("hashtag"); }}>{part}</button>
        ) : part
      )}
    </p>
  );
}

export function HashtagChip({ tag }: { tag: string }) {
  const { setActiveHashtag, setView } = useApp();
  return (
    <button onClick={() => { setActiveHashtag(tag); setView("hashtag"); }}
      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
      style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed", fontFamily: "JetBrains Mono, monospace" }}>
      #{tag}
    </button>
  );
}

export function PostCard({ post }: { post: Post }) {
  const { getUserById, likedPosts, toggleLike, currentUser, setView, setViewUserId } = useApp();
  const author = getUserById(post.authorId); if (!author) return null;
  const isLiked = likedPosts.has(post.id);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  return (
    <article className="glass rounded-2xl p-4 feed-item-enter" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,94,245,0.18)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
      {lightboxSrc && <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {showComments && <CommentsModal post={post} onClose={() => setShowComments(false)} />}

      {post.pinned && (
        <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "#f59e0b", fontFamily: "JetBrains Mono, monospace" }}>
          📌 Pinned Post
        </div>
      )}

      <div className="flex items-start gap-3">
        <button onClick={() => { setViewUserId(author.id); setView("profile"); }}><Av src={author.avatar} name={author.name} online={author.id !== "dev"} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button className="font-semibold text-sm hover:underline" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}
                onClick={() => { setViewUserId(author.id); setView("profile"); }}>{author.name}</button>
              {author.isVerified && <VerBadge color={author.verificationColor} />}
              {author.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "#f59e0b22", color: "#f59e0b", fontFamily: "JetBrains Mono, monospace" }}>DEV</span>}
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{author.handle}</span>
            </div>
            <div className="flex items-center gap-2">
              {post.tag && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: (post.tagColor || "#6d5ef5") + "22", color: post.tagColor || "#6d5ef5" }}>{post.tag}</span>}
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{post.time}</span>
              <div className="relative">
                <button onClick={() => setShowOptions((v) => !v)} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:opacity-80" style={{ color: "var(--muted-foreground)" }}>•••</button>
                {showOptions && <PostOptionsMenu post={post} onClose={() => setShowOptions(false)} />}
              </div>
            </div>
          </div>

          <RichText content={post.content} />

          {post.image && (
            <button className="mt-3 rounded-xl overflow-hidden w-full block" style={{ height: 200, background: "var(--muted)" }}
              onClick={() => setLightboxSrc(post.image!)}>
              <img src={post.image} alt="Post" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            </button>
          )}

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">{post.hashtags.map((tag) => <HashtagChip key={tag} tag={tag} />)}</div>
          )}

          <div className="flex items-center gap-5 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button className="flex items-center gap-1.5 text-xs transition-all active:scale-125"
              style={{ color: isLiked ? "#f43f5e" : "var(--muted-foreground)" }}
              onClick={() => toggleLike(post.id)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {post.likes + (isLiked ? 1 : 0)}
            </button>
            <button className="flex items-center gap-1.5 text-xs transition-all hover:opacity-80" style={{ color: "var(--muted-foreground)" }}
              onClick={() => setShowComments(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              {post.comments.length}
            </button>
            <button className="flex items-center gap-1.5 text-xs transition-all hover:opacity-70" style={{ color: "var(--muted-foreground)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              {post.shares}
            </button>
            <button className="ml-auto transition-all active:scale-110" style={{ color: saved ? "#6d5ef5" : "var(--muted-foreground)" }} onClick={() => setSaved((v) => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
EOF

cat > /home/claude/compux/src/components/ResourceItem.tsx << 'EOF'
import { useApp } from "../store";
import type { Resource } from "../types";

// ── Resource item ─────────────────────────────────────────────────────────────
export function ResourceItem({ resource: r }: { resource: Resource }) {
  const { incrementDownload, showToast } = useApp();
  const icons: Record<string, string> = { pdf: "📄", doc: "📝", ppt: "📊", xlsx: "📈" };
  const colors: Record<string, string> = { pdf: "#f43f5e", doc: "#3b82f6", ppt: "#f59e0b", xlsx: "#22c55e" };

  function handleDownload() {
    incrementDownload(r.id);
    showToast(`Downloading "${r.title}"...`);
  }

  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-4" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(109,94,245,0.15)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: (colors[r.fileType] || "#6d5ef5") + "18" }}>
        {icons[r.fileType] || "📄"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{r.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{r.subject} · {r.uploadedAt}</p>
        <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--muted-foreground)" }}>{r.downloads} downloads</p>
      </div>
      <button onClick={handleDownload} className="flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-semibold transition-all hover:opacity-80 active:scale-95"
        style={{ background: "var(--primary)", color: "#fff", fontFamily: "Outfit, sans-serif" }}>
        ⬇ Download
      </button>
    </div>
  );
}
EOF
echo "PostCard + ResourceItem written"
Output

PostCard + ResourceItem written
