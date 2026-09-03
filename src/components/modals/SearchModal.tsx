
import { useState, useRef, useEffect } from "react";
import { useApp } from "../../store";
import { Av, VerBadge } from "../primitives";

export function SearchModal({ onClose }: { onClose: () => void }) {
  const { users, posts, t, setView, setViewUserId, setActiveHashtag, currentUser } = useApp();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"people" | "posts" | "hashtags">("people");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();
  const filteredUsers = q ? users.filter((u) => u.id !== currentUser?.id && (u.name.toLowerCase().includes(q) || u.handle.toLowerCase().includes(q) || u.university.toLowerCase().includes(q))) : users.filter((u) => u.id !== currentUser?.id).slice(0, 6);
  const filteredPosts = q ? posts.filter((p) => p.content.toLowerCase().includes(q) || p.hashtags.some((h) => h.toLowerCase().includes(q))) : [];
  const allTags = Array.from(new Set(posts.flatMap((p) => p.hashtags)));
  const filteredTags = q ? allTags.filter((h) => h.toLowerCase().includes(q)) : allTags.slice(0, 10);
  const tagCounts: Record<string, number> = Object.fromEntries(allTags.map((h) => [h, posts.filter((p) => p.hashtags.includes(h)).length]));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4" onClick={onClose} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="glass rounded-2xl w-full max-w-lg overflow-hidden" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--muted-foreground)", flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent outline-none text-sm" style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }} />
          <button onClick={onClose} className="text-sm" style={{ color: "var(--muted-foreground)" }}>✕</button>
        </div>
        <div className="flex gap-1 p-2" style={{ borderBottom: "1px solid var(--border)" }}>
          {(["people", "posts", "hashtags"] as const).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={{ background: tab === tb ? "var(--primary)" : "transparent", color: tab === tb ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
              {tb === "people" ? t.searchPeople : tb === "posts" ? t.searchPosts : t.searchHashtags}
            </button>
          ))}
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {tab === "people" && (filteredUsers.length === 0
            ? <p className="text-center text-sm py-4" style={{ color: "var(--muted-foreground)" }}>{t.noResults}</p>
            : filteredUsers.map((u) => (
              <button key={u.id} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all hover:opacity-80 text-left"
                onClick={() => { setViewUserId(u.id); setView("profile"); onClose(); }}>
                <Av src={u.avatar} name={u.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{u.name}</span>
                    {u.isVerified && <VerBadge color={u.verificationColor} size={12} />}
                    {u.isAdmin && <span className="text-xs" style={{ color: "#f59e0b" }}>DEV</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>@{u.handle} · {u.university}</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{u.followers.length} followers</span>
              </button>
            ))
          )}
          {tab === "posts" && (filteredPosts.length === 0
            ? <p className="text-center text-sm py-4" style={{ color: "var(--muted-foreground)" }}>{q ? t.noResults : "Type to search posts..."}</p>
            : filteredPosts.slice(0, 5).map((p) => {
              const au = filteredUsers.find((u) => u.id === p.authorId) || users.find((u) => u.id === p.authorId);
              return (
                <div key={p.id} className="px-3 py-2 rounded-xl mb-1" style={{ background: "var(--muted)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {au && <span className="text-xs font-semibold" style={{ color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>{au.name}</span>}
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {p.time}</span>
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>{p.content}</p>
                </div>
              );
            })
          )}
          {tab === "hashtags" && (filteredTags.length === 0
            ? <p className="text-center text-sm py-4" style={{ color: "var(--muted-foreground)" }}>{t.noResults}</p>
            : filteredTags.map((tag) => (
              <button key={tag} className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all hover:opacity-80"
                onClick={() => { setActiveHashtag(tag); setView("hashtag"); onClose(); }}>
                <span className="text-sm font-semibold" style={{ color: "#7c3aed", fontFamily: "Outfit, sans-serif" }}>#{tag}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{tagCounts[tag]} posts</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
EOF

cat > /home/claude/compux/src/components/modals/FollowModal.tsx << 'EOF'
import { useApp } from "../../store";
import { Av, VerBadge } from "../primitives";
import type { User } from "../../types";

export function FollowModal({ userId, mode, onClose }: { userId: string; mode: "followers" | "following"; onClose: () => void }) {
  const { users, getUserById, t, followUser, isFollowing, setView, setViewUserId, currentUser } = useApp();
  const user = getUserById(userId); if (!user) return null;
  const ids = mode === "followers" ? user.followers : user.following;
  const list = ids.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-sm overflow-hidden" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-bold text-base" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{mode === "followers" ? t.followersList : t.followingList} ({list.length})</h2>
          <button onClick={onClose} style={{ color: "var(--muted-foreground)" }}>✕</button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {list.length === 0 ? <p className="text-center py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>—</p>
            : list.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                <button onClick={() => { setViewUserId(u.id); setView("profile"); onClose(); }}><Av src={u.avatar} name={u.name} size={36} /></button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button className="text-sm font-semibold hover:underline" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }} onClick={() => { setViewUserId(u.id); setView("profile"); onClose(); }}>{u.name}</button>
                    {u.isVerified && <VerBadge color={u.verificationColor} size={12} />}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{u.handle}</p>
                </div>
                {currentUser && currentUser.id !== u.id && (
                  <button onClick={() => followUser(u.id)} className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                    style={{ background: isFollowing(u.id) ? "var(--muted)" : "var(--primary)", color: isFollowing(u.id) ? "var(--muted-foreground)" : "#fff", fontFamily: "Outfit, sans-serif" }}>
                    {isFollowing(u.id) ? t.followingBtn : t.followBtn}
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
EOF
echo "SearchModal + FollowModal written"
Output

SearchModal + FollowModal written
