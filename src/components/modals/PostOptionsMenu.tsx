
import { useState, useRef, useEffect } from "react";
import { useApp } from "../../store";
import type { Post } from "../../types";

export function PostOptionsMenu({ post, onClose }: { post: Post; onClose: () => void }) {
  const { deletePost, currentUser, showToast, setPosts, addReport } = useApp();
  const isOwner = currentUser?.isAdmin || currentUser?.id === post.authorId;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  function handleCopyLink() { navigator.clipboard.writeText(`https://compux.io/post/${post.id}`).then(() => { showToast("Link copied! 🔗"); onClose(); }); }

  function handleSaveEdit() {
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, content: editText } : p));
    showToast("Post updated!"); onClose();
  }

  if (editing) return (
    <div ref={menuRef} className="absolute right-0 top-8 z-50 glass rounded-2xl p-3 w-72" style={{ border: "1px solid var(--border)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="w-full text-sm outline-none resize-none rounded-xl p-3 mb-2" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }} />
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>Cancel</button>
        <button onClick={handleSaveEdit} className="flex-1 py-2 rounded-xl text-xs font-semibold gradient-bg text-white" style={{ fontFamily: "Outfit, sans-serif" }}>Save</button>
      </div>
    </div>
  );

  return (
    <div ref={menuRef} className="absolute right-0 top-8 z-50 glass rounded-2xl py-1 w-48" style={{ border: "1px solid var(--border)", boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
      <button onClick={handleCopyLink} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-all hover:opacity-70" style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>🔗 Copy Link</button>
      {isOwner && <button onClick={() => setEditing(true)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-all hover:opacity-70" style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>✏️ Edit Post</button>}
      {isOwner && <button onClick={() => { deletePost(post.id); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-all hover:opacity-70" style={{ color: "#f43f5e", fontFamily: "Inter, sans-serif" }}>🗑 Delete Post</button>}
      <button onClick={() => { addReport(post.id, "Reported by user"); onClose(); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-all hover:opacity-70" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>🚩 Report</button>
    </div>
  );
}
EOF
echo "PostOptionsMenu written"
Output

PostOptionsMenu written
