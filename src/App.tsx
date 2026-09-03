import { useState, useRef, useEffect, useCallback } from "react";
import { AppProvider, useApp, INITIAL_USERS, ALL_BADGES, ANALYTICS } from "./store";
import type { User, Post, Comment, Badge, Resource, Report } from "./types";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════

function CompuxLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d5ef5" /><stop offset="50%" stopColor="#a855f7" /><stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M22 8C14.27 8 8 14.27 8 22C8 29.73 14.27 36 22 36C25.5 36 28.7 34.72 31.14 32.6L28.02 29.48C26.4 30.76 24.29 31.6 22 31.6C16.7 31.6 12.4 27.3 12.4 22C12.4 16.7 16.7 12.4 22 12.4C24.29 12.4 26.4 13.24 28.02 14.52L31.14 11.4C28.7 9.28 25.5 8 22 8Z" fill="url(#lg1)" />
      <path d="M26 15L32 21M32 15L26 21" stroke="url(#lg1)" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function Av({ src, name, size = 40, online = false }: { src: string; name: string; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <img src={src} alt={name} className="rounded-full object-cover w-full h-full" style={{ border: "2px solid rgba(109,94,245,0.35)" }} />
      {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: "2px solid var(--background)" }} />}
    </div>
  );
}

function VerBadge({ color = "#7c3aed", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="10" fill={color} />
      <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{ background: checked ? "var(--primary)" : "var(--muted)" }}>
      <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left: checked ? "calc(100% - 20px)" : "4px" }} />
    </button>
  );
}

function GlobalToast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl text-sm font-semibold text-white gradient-bg glow" style={{ fontFamily: "Outfit, sans-serif", pointerEvents: "none", boxShadow: "0 8px 32px rgba(109,94,245,0.4)" }}>
      ✓ {toast}
    </div>
  );
}

// Skeleton loader
function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-4 animate-pulse" style={{ border: "1px solid var(--border)" }}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: "var(--muted)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full w-1/3" style={{ background: "var(--muted)" }} />
          <div className="h-3 rounded-full w-2/3" style={{ background: "var(--muted)" }} />
          <div className="h-3 rounded-full w-1/2" style={{ background: "var(--muted)" }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-12 flex flex-col items-center text-center" style={{ border: "1px solid var(--border)" }}>
      <span className="text-5xl mb-4">{emoji}</span>
      <p className="font-bold text-base mb-1" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{title}</p>
      {sub && <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Badge Detail Modal ─────────────────────────────────────────────────────────
function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const { lang } = useApp();
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass rounded-3xl p-8 max-w-xs w-full text-center" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4" style={{ background: badge.color + "22", border: "2px solid " + badge.color + "44" }}>{badge.emoji}</div>
        <h2 className="text-xl font-extrabold mb-2" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{lang === "ar" ? badge.nameAr : badge.name}</h2>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{lang === "ar" ? badge.descAr : badge.desc}</p>
        <p className="text-xs font-mono" style={{ color: badge.color }}>Earned {badge.earnedAt}</p>
        <button onClick={onClose} className="mt-5 w-full py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>Close</button>
      </div>
    </div>
  );
}

// ── Lightbox Modal ─────────────────────────────────────────────────────────────
function LightboxModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)" }} onClick={onClose}>
      <img src={src} alt="media" className="max-w-full max-h-full rounded-2xl object-contain" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "rgba(255,255,255,0.15)" }}>✕</button>
    </div>
  );
}

// ── OTP Phone Verification Modal ───────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+964", flag: "🇮🇶", name: "Iraq" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
];

function OTPModal({ onClose }: { onClose: () => void }) {
  const { currentUser, verifyPhone, showToast } = useApp();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "otp") {
      setCountdown(60); setCanResend(false);
      const iv = setInterval(() => setCountdown((v) => { if (v <= 1) { clearInterval(iv); setCanResend(true); return 0; } return v - 1; }), 1000);
      return () => clearInterval(iv);
    }
  }, [step]);

  function handleSendOTP() {
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("otp"); setError(""); otpRefs.current[0]?.focus(); }, 1200);
  }

  function handleOtpChange(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentUser) verifyPhone(currentUser.id, countryCode.code + " " + phone);
      onClose();
    }, 1000);
  }

  const inp: React.CSSProperties = { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", width: "100%" };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass rounded-3xl p-6 w-full max-w-sm" style={{ border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-extrabold text-lg" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>
              {step === "phone" ? "📱 Phone Verification" : "🔐 Enter OTP"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>
              {step === "phone" ? "Add and verify your mobile number" : `Code sent to ${countryCode.code} ${phone}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>✕</button>
        </div>

        {step === "phone" ? (
          <div className="flex flex-col gap-3">
            {/* Country selector */}
            <div className="relative">
              <button onClick={() => setShowCountryList((v) => !v)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>
                <span className="text-xl">{countryCode.flag}</span>
                <span>{countryCode.code} — {countryCode.name}</span>
                <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {showCountryList && (
                <div className="absolute z-10 w-full mt-1 rounded-xl overflow-auto" style={{ background: "var(--background)", border: "1px solid var(--border)", maxHeight: 220, boxShadow: "0 12px 40px rgba(0,0,0,0.4)" }}>
                  {COUNTRY_CODES.map((c) => (
                    <button key={c.code + c.name} onClick={() => { setCountryCode(c); setShowCountryList(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-all hover:opacity-80"
                      style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input style={inp} type="tel" placeholder="770 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendOTP()} />
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button onClick={handleSendOTP} disabled={loading} className="gradient-bg glow text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 6-digit OTP input */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? "rgba(109,94,245,0.15)" : "var(--muted)",
                    border: digit ? "2px solid var(--primary)" : "1px solid var(--border)",
                    color: "var(--foreground)", fontFamily: "JetBrains Mono, monospace",
                  }}
                />
              ))}
            </div>
            {/* Countdown */}
            <div className="text-center">
              {canResend ? (
                <button onClick={() => { setOtp(["","","","","",""]); setStep("phone"); }} className="text-sm font-semibold" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>
                  Resend Code
                </button>
              ) : (
                <p className="text-sm" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>
                  Resend in <span style={{ color: "var(--primary)" }}>{countdown}s</span>
                </p>
              )}
            </div>
            {error && <p className="text-xs px-3 py-2 rounded-lg text-center" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button onClick={handleVerify} disabled={loading || otp.join("").length < 6} className="gradient-bg glow text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "Verifying..." : "Verify Number"}
            </button>
            <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>Any 6-digit code works in this demo</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Comments Modal ─────────────────────────────────────────────────────────────
function CommentsModal({ post, onClose }: { post: Post; onClose: () => void }) {
  const { getUserById, currentUser, setPosts } = useApp();
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function addComment() {
    if (!text.trim() || !currentUser) return;
    const c: Comment = { id: Date.now(), authorId: currentUser.id, text: text.trim(), time: "now", likes: 0, replies: [] };
    const next = [c, ...localComments];
    setLocalComments(next);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, comments: next } : p));
    setText("");
  }

  function addReply(commentId: number) {
    if (!replyText.trim() || !currentUser) return;
    const reply: Comment = { id: Date.now(), authorId: currentUser.id, text: replyText.trim(), time: "now", likes: 0, replies: [] };
    const next = localComments.map((c) => c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c);
    setLocalComments(next);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, comments: next } : p));
    setReplyText(""); setReplyTo(null);
  }

  function toggleCommentLike(commentId: number) {
    setLikedComments((prev) => { const n = new Set(prev); if (n.has(commentId)) n.delete(commentId); else n.add(commentId); return n; });
  }

  function CommentItem({ c, nested = false }: { c: Comment; nested?: boolean }) {
    const author = getUserById(c.authorId);
    const liked = likedComments.has(c.id);
    return (
      <div className={`flex gap-2.5 ${nested ? "ml-10 mt-2" : "mb-4"}`}>
        {author && <Av src={author.avatar} name={author.name} size={nested ? 26 : 32} />}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl px-3 py-2.5" style={{ background: "var(--muted)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{author?.name}</span>
              {author?.isVerified && <VerBadge color={author.verificationColor} size={10} />}
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {c.time}</span>
            </div>
            <p className="text-sm" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>{c.text}</p>
          </div>
          <div className="flex items-center gap-4 mt-1 px-1">
            <button onClick={() => toggleCommentLike(c.id)} className="flex items-center gap-1 text-xs transition-all" style={{ color: liked ? "#f43f5e" : "var(--muted-foreground)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              {c.likes + (liked ? 1 : 0)}
            </button>
            {!nested && (
              <button onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); }} className="text-xs font-semibold" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>Reply</button>
            )}
          </div>
          {replyTo === c.id && !nested && (
            <div className="flex gap-2 mt-2">
              {currentUser && <Av src={currentUser.avatar} name={currentUser.name} size={24} />}
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addReply(c.id)}
                placeholder={`Reply to ${author?.name}...`} className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }} autoFocus />
              <button onClick={() => addReply(c.id)} className="gradient-bg text-white text-xs px-3 py-2 rounded-xl font-semibold flex-shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>↵</button>
            </div>
          )}
          {c.replies.map((r) => <CommentItem key={r.id} c={r} nested />)}
        </div>
      </div>
    );
  }

  const author = getUserById(post.authorId);
  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="glass w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--border)", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {author && <Av src={author.avatar} name={author.name} size={32} />}
            <div>
              <p className="text-sm font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{author?.name}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{localComments.length} comments</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>✕</button>
        </div>
        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {localComments.length === 0
            ? <EmptyState emoji="💬" title="No comments yet" sub="Be the first to comment!" />
            : localComments.map((c) => <CommentItem key={c.id} c={c} />)
          }
        </div>
        {/* Input */}
        <div className="flex gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          {currentUser && <Av src={currentUser.avatar} name={currentUser.name} size={32} />}
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()}
            placeholder="Add a comment..." className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }} />
          <button onClick={addComment} className="gradient-bg glow text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>Post</button>
        </div>
      </div>
    </div>
  );
}

// ── Post Options Menu ──────────────────────────────────────────────────────────
function PostOptionsMenu({ post, onClose }: { post: Post; onClose: () => void }) {
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

// ── Search Modal ───────────────────────────────────────────────────────────────
function SearchModal({ onClose }: { onClose: () => void }) {
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

// ── Followers/Following Modal ─────────────────────────────────────────────────
function FollowModal({ userId, mode, onClose }: { userId: string; mode: "followers" | "following"; onClose: () => void }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// POST CARD
// ═══════════════════════════════════════════════════════════════════════════════
function RichText({ content }: { content: string }) {
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

function HashtagChip({ tag }: { tag: string }) {
  const { setActiveHashtag, setView } = useApp();
  return (
    <button onClick={() => { setActiveHashtag(tag); setView("hashtag"); }}
      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80"
      style={{ background: "rgba(124,58,237,0.12)", color: "#7c3aed", fontFamily: "JetBrains Mono, monospace" }}>
      #{tag}
    </button>
  );
}

function PostCard({ post }: { post: Post }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function AuthScreen() {
  const { t, lang, setLang, setCurrentUser, setView, dark, setDark, users, setUsers } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState(""); const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState(""); const [major, setMajor] = useState("");
  const [error, setError] = useState(""); const [showDev, setShowDev] = useState(false);
  const [loading, setLoading] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const devUser = INITIAL_USERS[0];

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const found = users.find((u) => u.email === email && u.password === password);
      if (!found) { setError(t.wrongCreds); setLoading(false); return; }
      setCurrentUser(found); setView("feed"); setLoading(false);
    }, 800);
  }

  function generateHandle(name: string) {
    const base = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    let h = base; let n = 1;
    while (users.some((u) => u.handle === h)) { h = base + n; n++; }
    return h;
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(t.passMismatch); return; }
    if (users.some((u) => u.email === email)) { setError("Email already in use."); return; }
    const newUser: User = {
      id: "u_" + Date.now(), email, password, name: fullName || "New Student",
      handle: generateHandle(fullName || "student"), role: major || "Student", bio: "",
      university: university || "University", faculty: "", major: major || "Undeclared", studyLevel: "Freshman",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",
      coverUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=300&fit=crop&auto=format",
      isAdmin: false, isVerified: false, verificationPending: false, verificationColor: "#7c3aed",
      followers: [], following: [], postCount: 0, studyHours: 0, badges: [ALL_BADGES[5]],
      github: "", linkedin: "", phone: "", phoneVerified: false, showPhone: false, banned: false,
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser); setView("feed");
  }

  const inp: React.CSSProperties = { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", borderRadius: 12, padding: "11px 14px", fontSize: 14, outline: "none", width: "100%" };

  return (
    <div className="gradient-mesh min-h-screen flex items-center justify-center p-4" dir={dir}>
      <div className="fixed top-4 right-4 flex gap-2">
        <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
          {lang === "en" ? "العربية" : "English"}
        </button>
        <button onClick={() => setDark(!dark)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: "var(--muted)" }}>{dark ? "☀️" : "🌙"}</button>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="glow rounded-2xl p-3 mb-3" style={{ background: "var(--secondary)" }}><CompuxLogo size={44} /></div>
          <h1 className="text-3xl font-extrabold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{t.appName}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t.tagline}</p>
        </div>
        <div className="glass rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
          <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "var(--muted)" }}>
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95"
                style={{ background: mode === m ? "var(--primary)" : "transparent", color: mode === m ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
                {m === "login" ? t.login : t.signup}
              </button>
            ))}
          </div>
          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="flex flex-col gap-3">
            {mode === "signup" && (
              <>
                <input style={inp} placeholder={t.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <input style={inp} placeholder={t.university} value={university} onChange={(e) => setUniversity(e.target.value)} />
                <input style={inp} placeholder={t.major} value={major} onChange={(e) => setMajor(e.target.value)} />
              </>
            )}
            <input style={inp} type="email" placeholder={t.email} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input style={inp} type="password" placeholder={t.password} value={password} onChange={(e) => setPassword(e.target.value)} required />
            {mode === "signup" && <input style={inp} type="password" placeholder={t.confirmPassword} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}
            {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "#f43f5e18", color: "#f43f5e" }}>{error}</p>}
            <button type="submit" disabled={loading} className="gradient-bg glow text-white font-bold py-3 rounded-xl mt-1 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60" style={{ fontFamily: "Outfit, sans-serif", fontSize: 15 }}>
              {loading ? "..." : mode === "login" ? t.login : t.signup}
            </button>
          </form>
          {mode === "login" && (
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={() => setShowDev((v) => !v)} className="w-full text-xs text-center hover:opacity-80 transition-opacity" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>
                🛠 {t.devHint}
              </button>
              {showDev && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "var(--secondary)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono, monospace" }}>
                  <div className="flex justify-between mb-1"><span style={{ color: "var(--muted-foreground)" }}>email:</span><span style={{ color: "var(--primary)" }}>{devUser.email}</span></div>
                  <div className="flex justify-between mb-2"><span style={{ color: "var(--muted-foreground)" }}>pass:</span><span style={{ color: "var(--primary)" }}>{devUser.password}</span></div>
                  <button onClick={() => { setEmail(devUser.email); setPassword(devUser.password); setError(""); }} className="w-full gradient-bg text-white text-xs py-1.5 rounded-lg font-semibold">Auto-fill</button>
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--muted-foreground)" }}>
          {mode === "login" ? t.noAccount : t.hasAccount}{" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="font-semibold" style={{ color: "var(--primary)" }}>
            {mode === "login" ? t.signup : t.login}
          </button>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE — full tabs
// ═══════════════════════════════════════════════════════════════════════════════
function ProfilePage() {
  const { viewUserId, currentUser, getUserById, setView, followUser, isFollowing, posts, events, resources, setCurrentUser, setUsers, lang, t } = useApp();
  const userId = viewUserId || currentUser?.id || "";
  const user = getUserById(userId);
  const [profileTab, setProfileTab] = useState<"posts" | "media" | "resources" | "events">("posts");
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => { setLoading(true); setTimeout(() => setLoading(false), 600); }, [userId]);

  if (!user) return null;
  const isMe = currentUser?.id === user.id;
  const following = isFollowing(user.id);
  const userPosts = posts.filter((p) => p.authorId === user.id);
  const mediaPosts = userPosts.filter((p) => p.image);
  const userResources = resources.filter((r) => r.uploadedBy === user.id);
  const userEvents = events.filter((ev) => ev.attending.includes(user.id));

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isMe) return;
    const url = URL.createObjectURL(file);
    const updated = { ...currentUser, avatar: url };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => u.id === currentUser.id ? updated : u));
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isMe) return;
    const url = URL.createObjectURL(file);
    const updated = { ...currentUser, coverUrl: url };
    setCurrentUser(updated);
    setUsers((prev) => prev.map((u) => u.id === currentUser.id ? updated : u));
  }

  const tabs = [
    { id: "posts", label: lang === "ar" ? "المنشورات" : "Posts", icon: "📝", count: userPosts.length },
    { id: "media", label: lang === "ar" ? "الميديا" : "Media", icon: "🖼", count: mediaPosts.length },
    { id: "resources", label: lang === "ar" ? "المصادر" : "Resources", icon: "📚", count: userResources.length },
    { id: "events", label: lang === "ar" ? "الفعاليات" : "Events", icon: "📅", count: userEvents.length },
  ] as const;

  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      {lightboxSrc && <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {selectedBadge && <BadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />}
      {followModal && <FollowModal userId={user.id} mode={followModal} onClose={() => setFollowModal(null)} />}

      {/* Cover */}
      <div className="relative h-48 overflow-hidden" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed,#3b82f6)" }}>
        <img src={user.coverUrl} alt="cover" className="w-full h-full object-cover opacity-50" />
        <button onClick={() => setView("feed")} className="absolute top-4 left-4 glass px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
          {t.backToFeed}
        </button>
        {isMe && (
          <label className="absolute top-4 right-4 glass px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer" style={{ fontFamily: "Outfit, sans-serif" }}>
            📷 Cover
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>
        )}
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 100px" }}>
        {/* Avatar + Actions row */}
        <div className="flex items-end justify-between -mt-16 mb-5">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-2xl object-cover"
              style={{ border: "4px solid var(--background)", boxShadow: "0 0 30px rgba(109,94,245,0.4)" }} />
            {isMe && (
              <label className="absolute inset-0 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <span className="text-white text-xs font-semibold">📷</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            )}
          </div>
          <div className="flex gap-2 pb-2">
            {isMe ? (
              <>
                <button onClick={() => setView("settings")} className="glass px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-all active:scale-95"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>
                  ⚙️
                </button>
                <button onClick={() => setView("settings")} className="gradient-bg glow px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
                  style={{ fontFamily: "Outfit, sans-serif" }}>
                  ✏️ {t.editProfile}
                </button>
              </>
            ) : currentUser && (
              <button onClick={() => followUser(user.id)} className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
                style={{ background: following ? "var(--muted)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: following ? "var(--foreground)" : "#fff", fontFamily: "Outfit, sans-serif" }}>
                {following ? t.followingBtn : t.followBtn}
              </button>
            )}
          </div>
        </div>

        {/* Name + university info */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{user.name}</h1>
              {user.isVerified && <VerBadge color={user.verificationColor} size={22} />}
              {user.isAdmin && <span className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background: "#f59e0b22", color: "#f59e0b", fontFamily: "JetBrains Mono, monospace" }}>🛠 DEV</span>}
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>
              @{user.handle}
            </p>
          </div>
          {/* External links */}
          <div className="flex gap-2">
            {user.github && (
              <a href={user.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            )}
            {user.linkedin && (
              <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)", color: "#0077b5" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>
              </a>
            )}
          </div>
        </div>

        {/* University info bar */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {user.university && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(109,94,245,0.12)", color: "#6d5ef5", fontFamily: "Inter, sans-serif" }}>
              🏛 {user.university}
            </span>
          )}
          {user.faculty && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", fontFamily: "Inter, sans-serif" }}>
              🏫 {user.faculty}
            </span>
          )}
          {user.major && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7", fontFamily: "Inter, sans-serif" }}>
              📐 {user.major}
            </span>
          )}
          {user.studyLevel && (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "Inter, sans-serif" }}>
              🎓 {user.studyLevel}
            </span>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>{user.bio}</p>
        )}

        {/* Gamification badges */}
        {user.badges.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Badges</p>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((b) => (
                <button key={b.id} onClick={() => setSelectedBadge(b)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80 active:scale-95"
                  style={{ background: b.color + "18", border: "1px solid " + b.color + "44", color: b.color, fontFamily: "Inter, sans-serif" }}
                  title={b.name}>
                  <span>{b.emoji}</span> {lang === "ar" ? b.nameAr : b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: lang === "ar" ? t.posts : "Posts", value: user.postCount, click: undefined },
            { label: lang === "ar" ? t.followers : "Followers", value: user.followers.length, click: () => setFollowModal("followers") },
            { label: lang === "ar" ? t.following : "Following", value: user.following.length, click: () => setFollowModal("following") },
            { label: lang === "ar" ? t.studyHours : "Study Hrs", value: user.isAdmin ? "∞" : user.studyHours + "h", click: undefined },
          ].map((s) => (
            <button key={s.label} onClick={s.click} className="glass rounded-2xl p-3 text-center transition-all hover:opacity-80 active:scale-95" style={{ border: "1px solid var(--border)", cursor: s.click ? "pointer" : "default" }}>
              <p className="text-xl font-extrabold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{s.label}</p>
            </button>
          ))}
        </div>

        {/* Profile Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: "var(--muted)" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setProfileTab(tab.id as typeof profileTab)} className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
              style={{ background: profileTab === tab.id ? "var(--primary)" : "transparent", color: profileTab === tab.id ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex flex-col gap-3">{[1,2].map((i) => <SkeletonCard key={i} />)}</div>
        ) : (
          <>
            {profileTab === "posts" && (
              <div className="flex flex-col gap-3">
                {userPosts.length === 0 ? <EmptyState emoji="📝" title="No posts yet" sub="Start sharing your thoughts!" />
                  : userPosts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )}

            {profileTab === "media" && (
              mediaPosts.length === 0 ? <EmptyState emoji="🖼" title="No media yet" sub="Posts with images will appear here." />
              : (
                <div className="grid grid-cols-3 gap-2">
                  {mediaPosts.map((p) => (
                    <button key={p.id} onClick={() => setLightboxSrc(p.image!)} className="aspect-square rounded-xl overflow-hidden" style={{ background: "var(--muted)" }}>
                      <img src={p.image} alt="media" className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
                    </button>
                  ))}
                </div>
              )
            )}

            {profileTab === "resources" && (
              userResources.length === 0 ? <EmptyState emoji="📚" title="No resources uploaded" sub="Share study materials with your campus!" />
              : (
                <div className="flex flex-col gap-3">
                  {userResources.map((r) => <ResourceItem key={r.id} resource={r} />)}
                </div>
              )
            )}

            {profileTab === "events" && (
              userEvents.length === 0 ? <EmptyState emoji="📅" title="No events joined" sub="RSVP to campus events to see them here." />
              : (
                <div className="flex flex-col gap-3">
                  {userEvents.map((ev) => (
                    <div key={ev.id} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: ev.color + "22" }}>{ev.emoji}</div>
                        <div>
                          <p className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{ev.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>📅 {ev.date} · 🕐 {ev.time} · 📍 {ev.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Resource item ─────────────────────────────────────────────────────────────
function ResourceItem({ resource: r }: { resource: Resource }) {
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

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function SettingsPage() {
  const { currentUser, setCurrentUser, updateUser, dark, setDark, lang, setLang, setView, t, requestVerification } = useApp();
  const [tab, setTab] = useState("profile");
  const [showOTP, setShowOTP] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  if (!currentUser) return null;

  const [displayName, setDisplayName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [university, setUniversity] = useState(currentUser.university);
  const [faculty, setFaculty] = useState(currentUser.faculty);
  const [major, setMajor] = useState(currentUser.major);
  const [studyLevel, setStudyLevel] = useState(currentUser.studyLevel);
  const [github, setGithub] = useState(currentUser.github || "");
  const [linkedin, setLinkedin] = useState(currentUser.linkedin || "");
  const [visibility, setVisibility] = useState<"public" | "private" | "friends">("public");
  const [showEmailP, setShowEmailP] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [twoFactor, setTwoFactor] = useState(currentUser.isAdmin);
  const [showPhone, setShowPhone] = useState(currentUser.showPhone);
  const [notifPosts, setNotifPosts] = useState(true);
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifDMs, setNotifDMs] = useState(true);
  const [notifStudy, setNotifStudy] = useState(false);
  const [curPass, setCurPass] = useState(""); const [newPass, setNewPass] = useState(""); const [confPass, setConfPass] = useState("");
  const { showToast } = useApp();

  function saveProfile() {
    if (!currentUser) return;
    const updated: User = { ...currentUser, name: displayName, bio, university, faculty, major, studyLevel, github, linkedin };
    updateUser(updated);
    showToast(t.saved);
  }

  const inp: React.CSSProperties = { background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", borderRadius: 12, padding: "10px 14px", fontSize: 14, outline: "none", width: "100%" };
  const rowItem = (label: string, control: React.ReactNode, sub?: string) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div><p className="text-sm font-medium" style={{ color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>{label}</p>{sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>}</div>
      {control}
    </div>
  );
  const sec = (label: string) => <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{label}</p>;
  const studyLevels = ["Freshman", "Sophomore", "Junior", "Senior", "Masters", "PhD"];

  const settingsNav = [
    { id: "profile", label: t.profileSettings, icon: "👤" },
    { id: "privacy", label: t.privacySettings, icon: "🔒" },
    { id: "notifications", label: t.notifications, icon: "🔔" },
    { id: "appearance", label: t.appearance, icon: "🎨" },
    { id: "verification", label: t.verificationTitle, icon: "✓" },
  ];

  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      {showOTP && <OTPModal onClose={() => setShowOTP(false)} />}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px 80px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Sidebar */}
        <aside className="glass rounded-2xl p-3 flex-shrink-0" style={{ border: "1px solid var(--border)", width: 220, alignSelf: "flex-start", position: "sticky", top: 24 }}>
          <button onClick={() => setView("feed")} className="flex items-center gap-2 text-sm mb-4 px-2 py-1.5 rounded-lg w-full hover:opacity-70" style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
            {t.backToFeed}
          </button>
          {settingsNav.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5 active:scale-95"
              style={{ background: tab === item.id ? "linear-gradient(135deg,rgba(109,94,245,0.18),rgba(139,92,246,0.12))" : "transparent", color: tab === item.id ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
          {currentUser.isAdmin && (
            <button onClick={() => setView("admin")} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium mt-1 active:scale-95" style={{ color: "#f59e0b", fontFamily: "Outfit, sans-serif" }}>
              🛠 {t.adminPanel}
            </button>
          )}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => { setCurrentUser(null); setView("feed"); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium active:scale-95" style={{ color: "#f43f5e", fontFamily: "Outfit, sans-serif" }}>
              🚪 {t.logout}
            </button>
          </div>
        </aside>

        {/* Content panels */}
        <div className="flex-1" style={{ minWidth: 280 }}>
          {tab === "profile" && (
            <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              {sec(t.profileSettings)}
              <div className="flex flex-col gap-3 mb-5">
                <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{t.fullName}</label><input style={inp} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{t.bio}</label><textarea rows={3} style={{ ...inp, resize: "none" }} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t.bioPlaceholder} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{t.university}</label><input style={inp} value={university} onChange={(e) => setUniversity(e.target.value)} /></div>
                  <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Faculty / College</label><input style={inp} value={faculty} onChange={(e) => setFaculty(e.target.value)} /></div>
                  <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>{t.major}</label><input style={inp} value={major} onChange={(e) => setMajor(e.target.value)} /></div>
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>Study Level</label>
                    <select style={{ ...inp, cursor: "pointer" }} value={studyLevel} onChange={(e) => setStudyLevel(e.target.value as User["studyLevel"])}>
                      <option value="">Select level</option>
                      {studyLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>GitHub URL</label><input style={inp} value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." /></div>
                  <div><label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>LinkedIn URL</label><input style={inp} value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." /></div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setView("feed")} className="px-4 py-2 rounded-xl text-sm font-semibold active:scale-95" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.cancel}</button>
                <button onClick={saveProfile} className="gradient-bg glow px-5 py-2 rounded-xl text-sm font-semibold text-white active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>{t.saveChanges}</button>
              </div>
            </div>
          )}

          {tab === "privacy" && (
            <div className="flex flex-col gap-4">
              <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                {sec(t.privacySettings)}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>{t.profileVisibility}</p>
                  <div className="flex gap-2">
                    {(["public", "private", "friends"] as const).map((v) => (
                      <button key={v} onClick={() => setVisibility(v)} className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all active:scale-95"
                        style={{ background: visibility === v ? "var(--primary)" : "var(--muted)", color: visibility === v ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
                        {v === "public" ? t.publicProfile : v === "private" ? t.privateProfile : t.friendsOnly}
                      </button>
                    ))}
                  </div>
                </div>
                {rowItem(t.showEmail, <Toggle checked={showEmailP} onChange={() => setShowEmailP((v) => !v)} />)}
                {rowItem(t.showActivity, <Toggle checked={showActivity} onChange={() => setShowActivity((v) => !v)} />)}
                {rowItem(t.allowDMs, <Toggle checked={allowDMs} onChange={() => setAllowDMs((v) => !v)} />)}
                {rowItem(t.allowTagging, <Toggle checked={allowTagging} onChange={() => setAllowTagging((v) => !v)} />)}
                {rowItem(t.twoFactor, <Toggle checked={twoFactor} onChange={() => setTwoFactor((v) => !v)} />, twoFactor ? t.enabled : t.disabled)}
                {rowItem("Show Phone Number", <Toggle checked={showPhone} onChange={() => setShowPhone((v) => !v)} />, showPhone ? "Visible on profile" : "Hidden")}
              </div>

              {/* Phone Verification */}
              <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                {sec("Phone Verification")}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>Mobile Number</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {currentUser.phone ? currentUser.phone : "Not added yet"}
                      {currentUser.phoneVerified && <span className="ml-2 text-green-400">✓ Verified</span>}
                    </p>
                  </div>
                  <button onClick={() => setShowOTP(true)} className="text-xs px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-80 active:scale-95"
                    style={{ background: currentUser.phoneVerified ? "var(--muted)" : "var(--primary)", color: currentUser.phoneVerified ? "var(--muted-foreground)" : "#fff", fontFamily: "Outfit, sans-serif" }}>
                    {currentUser.phoneVerified ? "Change Number" : "Add & Verify"}
                  </button>
                </div>
              </div>

              {/* Change password */}
              <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                {sec(t.changePassword)}
                <div className="flex flex-col gap-3">
                  <input style={inp} type="password" placeholder={t.currentPassword} value={curPass} onChange={(e) => setCurPass(e.target.value)} />
                  <input style={inp} type="password" placeholder={t.newPassword} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                  <input style={inp} type="password" placeholder={t.confirmNew} value={confPass} onChange={(e) => setConfPass(e.target.value)} />
                  <button onClick={() => { if (newPass && newPass === confPass) { showToast(t.passwordUpdated); setCurPass(""); setNewPass(""); setConfPass(""); } }} className="gradient-bg glow py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>{t.updatePassword}</button>
                </div>
              </div>
            </div>
          )}

          {tab === "notifications" && (
            <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              {sec(t.notifications)}
              {rowItem(t.notifPosts, <Toggle checked={notifPosts} onChange={() => setNotifPosts((v) => !v)} />, notifPosts ? t.enabled : t.disabled)}
              {rowItem(t.notifEvents, <Toggle checked={notifEvents} onChange={() => setNotifEvents((v) => !v)} />, notifEvents ? t.enabled : t.disabled)}
              {rowItem(t.notifDMs, <Toggle checked={notifDMs} onChange={() => setNotifDMs((v) => !v)} />, notifDMs ? t.enabled : t.disabled)}
              {rowItem(t.notifStudy, <Toggle checked={notifStudy} onChange={() => setNotifStudy((v) => !v)} />, notifStudy ? t.enabled : t.disabled)}
            </div>
          )}

          {tab === "appearance" && (
            <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              {sec(t.appearance)}
              {rowItem(t.darkMode, <Toggle checked={dark} onChange={() => setDark(!dark)} />, dark ? t.enabled : t.disabled)}
              {rowItem(t.language,
                <div className="flex gap-2">
                  {(["en", "ar"] as const).map((l) => (
                    <button key={l} onClick={() => setLang(l)} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all active:scale-95"
                      style={{ background: lang === l ? "var(--primary)" : "var(--muted)", color: lang === l ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
                      {l === "en" ? "English" : "العربية"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "verification" && (
            <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
              {sec(t.verificationTitle)}
              <div className="flex items-center gap-4 p-4 rounded-2xl mb-5" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <VerBadge color="#7c3aed" size={44} />
                <div>
                  <p className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.verificationTitle}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{t.verificationDesc}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl mb-4 text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.verificationCriteria}</div>
              {currentUser.isVerified
                ? <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#22c55e" }}><VerBadge color="#22c55e" size={18} /> {t.verifyApproved}</div>
                : currentUser.verificationPending
                  ? <div className="flex items-center gap-2 text-sm" style={{ color: "#f59e0b" }}>⏳ {t.verifyPending}</div>
                  : <button onClick={requestVerification} className="gradient-bg glow px-5 py-3 rounded-xl text-sm font-semibold text-white active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>{t.requestVerify}</button>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPanel() {
  const { users, posts, reports, notifications, verifyUser, banUser, deletePost, setView, resolveReport, t, lang, resources } = useApp();
  const [tab, setTab] = useState("stats");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const pendingVerify = users.filter((u) => u.verificationPending);
  const pendingReports = reports.filter((r) => r.status === "pending");
  const maxVal = Math.max(...ANALYTICS.dailyUsers);

  const adminTabs = [
    { id: "stats", label: "Analytics", icon: "📊" },
    { id: "users", label: "Users", icon: "👥", badge: users.filter((u) => u.banned).length || undefined },
    { id: "posts", label: "Posts", icon: "📝" },
    { id: "reports", label: "Reports", icon: "🚩", badge: pendingReports.length || undefined },
    { id: "verify", label: "Verify", icon: "✓", badge: pendingVerify.length || undefined },
  ];

  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 100px", display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Sidebar */}
        <aside className="glass rounded-2xl p-3 flex-shrink-0" style={{ border: "1px solid var(--border)", width: 200, alignSelf: "flex-start", position: "sticky", top: 24 }}>
          <div className="flex items-center gap-2 px-2 py-2 mb-3">
            <span className="text-lg">🛠</span>
            <span className="font-bold text-sm gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>Dev Panel</span>
          </div>
          <button onClick={() => setView("feed")} className="flex items-center gap-2 text-xs w-full px-2 py-1.5 rounded-lg mb-2 hover:opacity-70" style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button>
          {adminTabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5 active:scale-95"
              style={{ background: tab === item.id ? "linear-gradient(135deg,rgba(109,94,245,0.18),rgba(139,92,246,0.12))" : "transparent", color: tab === item.id ? "var(--primary)" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
              <span>{item.icon}</span>{item.label}
              {item.badge ? <span className="ml-auto w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-bold">{item.badge}</span> : null}
            </button>
          ))}
        </aside>

        <div className="flex-1" style={{ minWidth: 280 }}>
          {/* Analytics tab */}
          {tab === "stats" && (
            <div className="flex flex-col gap-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Users", value: users.length, icon: "👥", color: "#6d5ef5", sub: `+${Math.round(users.length * 0.12)} this week` },
                  { label: "Total Posts", value: posts.length, icon: "📝", color: "#3b82f6", sub: `${resources.length} resources shared` },
                  { label: "Active Today", value: Math.floor(users.length * 0.7), icon: "🟢", color: "#22c55e", sub: "70% daily retention" },
                  { label: "Pending Actions", value: pendingVerify.length + pendingReports.length, icon: "⏳", color: "#f59e0b", sub: `${pendingVerify.length} verify · ${pendingReports.length} reports` },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.color, fontFamily: "JetBrains Mono, monospace" }}>{s.label}</span>
                    </div>
                    <p className="text-3xl font-extrabold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart — Daily Active Users */}
              <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Daily Active Users — Aug/Sep 2026</p>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", fontFamily: "JetBrains Mono, monospace" }}>+{Math.round((ANALYTICS.dailyUsers[ANALYTICS.dailyUsers.length-1] / ANALYTICS.dailyUsers[0] - 1) * 100)}% growth</span>
                </div>
                <div className="flex items-end gap-1" style={{ height: 120 }}>
                  {ANALYTICS.dailyUsers.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${ANALYTICS.labels[i]}: ${val} users`}>
                      <div className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-default"
                        style={{ height: `${(val / maxVal) * 100}%`, background: `linear-gradient(to top, #4f46e5, #a855f7)`, minHeight: 4 }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1 mt-2">
                  {ANALYTICS.labels.map((l, i) => (
                    <div key={i} className="flex-1 text-center" style={{ fontSize: 8, color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace", overflow: "hidden" }}>{l.split(" ")[0]}</div>
                  ))}
                </div>
              </div>

              {/* Posts chart */}
              <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Daily Posts</p>
                <div className="flex items-end gap-1" style={{ height: 80 }}>
                  {ANALYTICS.dailyPosts.map((val, i) => {
                    const max = Math.max(...ANALYTICS.dailyPosts);
                    return (
                      <div key={i} className="flex-1 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${(val / max) * 100}%`, background: "linear-gradient(to top, #3b82f6, #06b6d4)", minHeight: 4 }} />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Users tab */}
          {tab === "users" && (
            <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>All Users ({users.length})</p>
              <div className="flex flex-col gap-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: u.banned ? "rgba(244,63,94,0.08)" : "var(--muted)", border: "1px solid var(--border)" }}>
                    <Av src={u.avatar} name={u.name} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{u.name}</span>
                        {u.isVerified && <VerBadge color={u.verificationColor} size={12} />}
                        {u.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f59e0b22", color: "#f59e0b", fontFamily: "JetBrains Mono, monospace" }}>ADMIN</span>}
                        {u.banned && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#f43f5e22", color: "#f43f5e", fontFamily: "JetBrains Mono, monospace" }}>BANNED</span>}
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>@{u.handle} · {u.email} · {u.followers.length} followers</p>
                    </div>
                    {!u.isAdmin && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => banUser(u.id)} className="text-xs px-2 py-1.5 rounded-lg font-semibold active:scale-95 transition-all"
                          style={{ background: u.banned ? "#22c55e22" : "#f43f5e22", color: u.banned ? "#22c55e" : "#f43f5e", fontFamily: "Outfit, sans-serif" }}>
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                        <button onClick={() => verifyUser(u.id, !u.isVerified)} className="text-xs px-2 py-1.5 rounded-lg font-semibold active:scale-95 transition-all"
                          style={{ background: "rgba(124,58,237,0.15)", color: "#7c3aed", fontFamily: "Outfit, sans-serif" }}>
                          {u.isVerified ? "Unverify" : "Verify"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts tab */}
          {tab === "posts" && (
            <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>All Posts ({posts.length})</p>
              <div className="flex flex-col gap-2">
                {posts.map((p) => {
                  const author = users.find((u) => u.id === p.authorId);
                  return (
                    <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                      {author && <Av src={author.avatar} name={author.name} size={30} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: "var(--foreground)", fontFamily: "Outfit, sans-serif" }}>{author?.name}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· {p.time}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>· ❤️ {p.likes + (p.comments.length)}</span>
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>{p.content}</p>
                      </div>
                      <button onClick={() => deletePost(p.id)} className="flex-shrink-0 text-xs px-2 py-1.5 rounded-lg font-semibold active:scale-95"
                        style={{ background: "#f43f5e22", color: "#f43f5e", fontFamily: "Outfit, sans-serif" }}>Delete</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports tab */}
          {tab === "reports" && (
            <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Moderation Feed ({reports.length})</p>
              {reports.length === 0 ? <EmptyState emoji="✅" title="No reports" sub="All clear!" />
                : reports.map((r: Report) => {
                  const post = posts.find((p) => p.id === r.postId);
                  const reporter = users.find((u) => u.id === r.reportedBy);
                  const postAuthor = post ? users.find((u) => u.id === post.authorId) : null;
                  return (
                    <div key={r.id} className="p-4 rounded-2xl mb-3" style={{ background: r.status === "pending" ? "rgba(244,63,94,0.06)" : "var(--muted)", border: "1px solid " + (r.status === "pending" ? "rgba(244,63,94,0.2)" : "var(--border)") }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: r.status === "pending" ? "#f43f5e22" : "#22c55e22", color: r.status === "pending" ? "#f43f5e" : "#22c55e" }}>{r.status}</span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{r.createdAt}</span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: "var(--foreground)", fontFamily: "Inter, sans-serif" }}>{r.reason}</p>
                          {reporter && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Reported by @{reporter.handle}</p>}
                          {post && <p className="text-xs mt-1 line-clamp-2 italic" style={{ color: "var(--muted-foreground)" }}>"{post.content.slice(0, 80)}..."</p>}
                          {postAuthor && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Post by @{postAuthor.handle}</p>}
                        </div>
                      </div>
                      {r.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => resolveReport(r.id, "delete")} className="text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95"
                            style={{ background: "#f43f5e22", color: "#f43f5e", fontFamily: "Outfit, sans-serif" }}>🗑 Delete Content</button>
                          <button onClick={() => resolveReport(r.id, "warn")} className="text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95"
                            style={{ background: "#f59e0b22", color: "#f59e0b", fontFamily: "Outfit, sans-serif" }}>⚠️ Warn User</button>
                          <button onClick={() => resolveReport(r.id, "dismiss")} className="text-xs px-3 py-1.5 rounded-lg font-semibold active:scale-95"
                            style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>✕ Dismiss</button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Verify tab */}
          {tab === "verify" && (
            <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Verification Requests ({pendingVerify.length})</p>
              {pendingVerify.length === 0 ? <EmptyState emoji="✅" title="No pending requests" sub="All verification requests handled." />
                : pendingVerify.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-4 rounded-2xl mb-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <Av src={u.avatar} name={u.name} size={44} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{u.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>@{u.handle} · {u.university} · {u.studyLevel}</div>
                      <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--muted-foreground)" }}>{u.followers.length} followers · {u.postCount} posts · {u.email}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => verifyUser(u.id, true)} className="text-sm px-3 py-2 rounded-xl font-semibold active:scale-95" style={{ background: "#22c55e22", color: "#22c55e", fontFamily: "Outfit, sans-serif" }}>✓ Approve</button>
                      <button onClick={() => verifyUser(u.id, false)} className="text-sm px-3 py-2 rounded-xl font-semibold active:scale-95" style={{ background: "#f43f5e22", color: "#f43f5e", fontFamily: "Outfit, sans-serif" }}>✕ Reject</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY VIEWS (Messages, Alerts, Events, Study, Explore, Hashtag)
// ═══════════════════════════════════════════════════════════════════════════════
function MessagesView() {
  const { dms, users, currentUser, getUserById, sendDM, t, lang, setView } = useApp();
  const [activeDM, setActiveDM] = useState<string | null>(dms[0]?.userId || null);
  const [msgText, setMsgText] = useState("");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const active = dms.find((d) => d.userId === activeDM);
  const activeUser = getUserById(activeDM || "");

  function handleSend() { if (!msgText.trim() || !activeDM) return; sendDM(activeDM, msgText.trim()); setMsgText(""); }

  return (
    <div className="gradient-mesh" style={{ height: "100vh", display: "flex", flexDirection: "column" }} dir={dir}>
      <div className="glass-nav h-14 flex items-center gap-3 px-4" style={{ border: "1px solid var(--border)", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <button onClick={() => setView("feed")} style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button>
        <h2 className="font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.dmTitle}</h2>
      </div>
      <div className="flex flex-1 overflow-hidden" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
        <div className="flex flex-col py-3 px-2 overflow-y-auto flex-shrink-0" style={{ width: 260, borderRight: "1px solid var(--border)" }}>
          {users.filter((u) => u.id !== currentUser?.id).map((u) => {
            const dm = dms.find((d) => d.userId === u.id);
            return (
              <button key={u.id} onClick={() => setActiveDM(u.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all active:scale-95"
                style={{ background: activeDM === u.id ? "linear-gradient(135deg,rgba(109,94,245,0.18),rgba(139,92,246,0.12))" : "transparent" }}>
                <Av src={u.avatar} name={u.name} size={36} online />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1"><span className="text-sm font-semibold truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{u.name}</span>{u.isVerified && <VerBadge color={u.verificationColor} size={11} />}</div>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{dm?.messages[dm.messages.length - 1]?.text || "Say hi!"}</p>
                </div>
                {dm && dm.unread > 0 && <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">{dm.unread}</span>}
              </button>
            );
          })}
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeUser ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <Av src={activeUser.avatar} name={activeUser.name} size={36} online />
                <div className="flex items-center gap-1.5"><span className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{activeUser.name}</span>{activeUser.isVerified && <VerBadge color={activeUser.verificationColor} size={13} />}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {active?.messages.map((msg, i) => {
                  const isMe = msg.from === currentUser?.id;
                  const sender = getUserById(msg.from);
                  return (
                    <div key={i} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      {sender && <Av src={sender.avatar} name={sender.name} size={28} />}
                      <div className="max-w-xs px-3 py-2 rounded-2xl text-sm" style={{ background: isMe ? "var(--primary)" : "var(--muted)", color: isMe ? "#fff" : "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>
                        {msg.text}<span className="block text-xs mt-1 opacity-50">{msg.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
                <input value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t.typeMessage} className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "Inter, sans-serif" }} />
                <button onClick={handleSend} className="gradient-bg glow px-4 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95" style={{ fontFamily: "Outfit, sans-serif" }}>{t.send}</button>
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center"><EmptyState emoji="💬" title="Select a conversation" /></div>}
        </div>
      </div>
    </div>
  );
}

function AlertsView() {
  const { notifications, setNotifications, getUserById, t, lang, setView } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const unread = notifications.filter((n) => !n.read).length;
  const icons: Record<string, string> = { like: "❤️", comment: "💬", follow: "👤", event: "📅", verify: "✓" };
  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setView("feed")} style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button>
            <h1 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.alerts}</h1>
            {unread > 0 && <span className="gradient-bg text-white text-xs px-2 py-0.5 rounded-full font-bold">{unread}</span>}
          </div>
          {unread > 0 && <button onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))} className="text-xs font-semibold active:scale-95" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>{t.markRead}</button>}
        </div>
        {notifications.length === 0 ? <EmptyState emoji="🔔" title={t.noAlerts} /> :
          notifications.map((n) => {
            const from = getUserById(n.fromId);
            return (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-2 transition-all" style={{ background: n.read ? "var(--muted)" : "rgba(109,94,245,0.1)", border: "1px solid var(--border)" }}>
                <div className="flex-shrink-0 text-lg">{icons[n.type] || "🔔"}</div>
                {from && <Av src={from.avatar} name={from.name} size={32} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--card-foreground)", fontFamily: "Inter, sans-serif" }}>{n.text}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{n.time}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "var(--primary)" }} />}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function EventsView() {
  const { events, setEvents, currentUser, t, lang, setView } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  function toggleAttend(id: number) { if (!currentUser) return; setEvents((prev) => prev.map((ev) => ev.id !== id ? ev : { ...ev, attending: ev.attending.includes(currentUser.id) ? ev.attending.filter((x) => x !== currentUser.id) : [...ev.attending, currentUser.id] })); }
  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div className="flex items-center gap-3 mb-6"><button onClick={() => setView("feed")} style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button><h1 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.events}</h1></div>
        {events.length === 0 ? <EmptyState emoji="📅" title="No events yet" /> :
          events.map((ev) => {
            const going = currentUser && ev.attending.includes(currentUser.id);
            return (
              <div key={ev.id} className="glass rounded-2xl p-5 mb-4" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,94,245,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: ev.color + "22" }}>{ev.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: ev.color, fontFamily: "JetBrains Mono, monospace" }}>{ev.category}</span>
                        <h3 className="font-bold text-base mt-0.5" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{ev.title}</h3>
                        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{ev.description}</p>
                      </div>
                      <button onClick={() => toggleAttend(ev.id)} className="text-sm px-4 py-2 rounded-full font-semibold flex-shrink-0 active:scale-95 transition-all"
                        style={{ background: going ? ev.color : ev.color + "18", color: going ? "#fff" : ev.color, fontFamily: "Outfit, sans-serif" }}>
                        {going ? t.going : t.rsvp}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>📅 {ev.date}</span><span>🕐 {ev.time}</span><span>📍 {ev.location}</span><span style={{ color: ev.color }}>{ev.attending.length} {t.attending}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">{ev.hashtags.map((tag) => <HashtagChip key={tag} tag={tag} />)}</div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function StudyView() {
  const { groups, setGroups, currentUser, t, lang, setView } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  function toggleJoin(id: string) { if (!currentUser) return; setGroups((prev) => prev.map((g) => g.id !== id ? g : { ...g, members: g.members.includes(currentUser.id) ? g.members.filter((x) => x !== currentUser.id) : (g.members.length < g.maxMembers ? [...g.members, currentUser.id] : g.members) })); }
  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div className="flex items-center gap-3 mb-6"><button onClick={() => setView("feed")} style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button><h1 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.study}</h1></div>
        {groups.length === 0 ? <EmptyState emoji="📚" title="No study groups" /> :
          groups.map((g) => {
            const joined = currentUser ? g.members.includes(currentUser.id) : false;
            const fill = (g.members.length / g.maxMembers) * 100;
            return (
              <div key={g.id} className="glass rounded-2xl p-5 mb-4" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,94,245,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-bold text-base" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{g.name}</h3>{g.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#22c55e22", color: "#22c55e" }}>{t.activeNow}</span>}</div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{g.subject}</p>
                  </div>
                  <button onClick={() => toggleJoin(g.id)} className="text-sm px-4 py-2 rounded-full font-semibold active:scale-95 transition-all"
                    style={{ background: joined ? "var(--primary)" : "var(--secondary)", color: joined ? "#fff" : "var(--secondary-foreground)", fontFamily: "Outfit, sans-serif" }}>
                    {joined ? t.joined : t.join}
                  </button>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: fill + "%", background: `linear-gradient(90deg,${g.color},#a855f7)` }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span>{g.members.length}/{g.maxMembers} members</span><span>{t.next}: {g.nextSession}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function ExploreView() {
  const { users, posts, currentUser, followUser, isFollowing, setView, setViewUserId, t, lang, setActiveHashtag } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const allTags = Array.from(new Set(posts.flatMap((p) => p.hashtags)));
  const tagCounts: Record<string,number> = Object.fromEntries(allTags.map((h) => [h, posts.filter((p) => p.hashtags.includes(h)).length]));
  const sorted = allTags.sort((a, b) => (tagCounts[b]||0) - (tagCounts[a]||0));
  const suggested = users.filter((u) => u.id !== currentUser?.id && !currentUser?.following.includes(u.id)).slice(0, 8);
  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div className="flex items-center gap-3 mb-6"><button onClick={() => setView("feed")} style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button><h1 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{t.explore}</h1></div>
        <div className="glass rounded-2xl p-5 mb-4" style={{ border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.trending}</p>
          <div className="grid grid-cols-2 gap-2">
            {sorted.map((tag, i) => (
              <button key={tag} onClick={() => { setActiveHashtag(tag); setView("hashtag"); }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono w-4 text-right flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
                  <span className="text-sm font-semibold" style={{ color: "#7c3aed", fontFamily: "Outfit, sans-serif" }}>#{tag}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{tagCounts[tag]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5" style={{ border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Suggested People</p>
          <div className="flex flex-col gap-3">
            {suggested.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <button onClick={() => { setViewUserId(u.id); setView("profile"); }}><Av src={u.avatar} name={u.name} size={42} /></button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button className="text-sm font-semibold hover:underline" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }} onClick={() => { setViewUserId(u.id); setView("profile"); }}>{u.name}</button>
                    {u.isVerified && <VerBadge color={u.verificationColor} size={13} />}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{u.handle} · {u.university} · {u.followers.length} followers</p>
                </div>
                <button onClick={() => followUser(u.id)} className="text-xs px-3 py-1.5 rounded-full font-semibold active:scale-95 transition-all"
                  style={{ background: isFollowing(u.id) ? "var(--muted)" : "var(--primary)", color: isFollowing(u.id) ? "var(--muted-foreground)" : "#fff", fontFamily: "Outfit, sans-serif" }}>
                  {isFollowing(u.id) ? t.followingBtn : t.followBtn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HashtagPage() {
  const { activeHashtag, posts, setView, t, lang } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const filtered = posts.filter((p) => p.hashtags.includes(activeHashtag) || p.content.toLowerCase().includes("#" + activeHashtag.toLowerCase()));
  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 100px" }}>
        <button onClick={() => setView("feed")} className="text-sm mb-4 flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{t.backToFeed}</button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white gradient-bg glow">#</div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>#{activeHashtag}</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{filtered.length} {t.postsHashtag}</p>
          </div>
        </div>
        {filtered.length === 0 ? <EmptyState emoji="#️⃣" title="No posts" sub={`No posts found with #${activeHashtag}`} />
          : <div className="flex flex-col gap-3">{filtered.map((p) => <PostCard key={p.id} post={p} />)}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEED VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function FeedView() {
  const { t, lang, setLang, dark, setDark, currentUser, setView, setViewUserId,
    posts, notifications, addPost, users, isFollowing, followUser,
    setActiveHashtag, events, setEvents, groups, setGroups, dms } = useApp();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [activeNav, setActiveNav] = useState("home");
  const [feedTab, setFeedTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 800); }, []);

  const unreadAlerts = notifications.filter((n) => !n.read).length;
  const navItems = [
    { icon: "🏠", label: t.home, id: "home", view: "feed" as const },
    { icon: "🔭", label: t.explore, id: "explore", view: "explore" as const },
    { icon: "📅", label: t.events, id: "events", view: "events" as const },
    { icon: "📚", label: t.study, id: "study", view: "study" as const },
    { icon: "💬", label: t.messages, id: "messages", view: "messages" as const },
    { icon: "🔔", label: t.alerts, id: "alerts", view: "alerts" as const, badge: unreadAlerts || undefined },
    { icon: "👤", label: t.profile, id: "profile", view: "profile" as const },
    ...(currentUser?.isAdmin ? [{ icon: "🛠", label: "Admin", id: "admin", view: "admin" as const }] : []),
  ];
  const feedTabs = [t.feedAll, t.feedPosts, t.feedEvents, t.feedStudy];
  const allTags = Array.from(new Set(posts.flatMap((p) => p.hashtags)));
  const tagCounts: Record<string,number> = Object.fromEntries(allTags.map((h) => [h, posts.filter((p) => p.hashtags.includes(h)).length]));
  const trendingTopics = allTags.sort((a, b) => (tagCounts[b]||0)-(tagCounts[a]||0)).slice(0, 5).map((tag, i) => ({ tag, color: ["#f43f5e","#6d5ef5","#f59e0b","#22c55e","#3b82f6"][i % 5], count: tagCounts[tag] }));
  const suggestedUsers = users.filter((u) => u.id !== currentUser?.id && !currentUser?.following.includes(u.id)).slice(0, 3);
  const dmPreviews = dms.slice(0, 3).map((d) => ({ ...d, user: users.find((u) => u.id === d.userId) })).filter((d) => d.user);

  function handleNav(id: string, view: string) {
    if (view === "profile") { setViewUserId(currentUser?.id || null); setView("profile"); return; }
    setActiveNav(id);
    if (view !== "feed") setView(view as any);
  }

  function handleCompose() {
    if (!composeText.trim()) return;
    const tags = (composeText.match(/#(\w+)/g) || []).map((t) => t.slice(1));
    addPost(composeText, tags);
    setComposeText("");
  }

  return (
    <div className="gradient-mesh min-h-screen" dir={dir}>
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}

      {/* Top bar */}
      <header className="glass-nav sticky top-0 z-50 px-4 md:px-6 h-16 flex items-center gap-4" style={{ borderBottom: "1px solid var(--border)", borderTop: "none", borderLeft: "none", borderRight: "none" }}>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="glow-sm rounded-xl p-1" style={{ background: "var(--secondary)" }}><CompuxLogo size={28} /></div>
          <span className="text-xl font-extrabold tracking-tight gradient-text hidden sm:block" style={{ fontFamily: "Outfit, sans-serif" }}>{t.appName}</span>
        </div>
        <button onClick={() => setSearchOpen(true)} className="flex-1 max-w-md mx-auto flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-all hover:opacity-80 active:scale-98"
          style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          {t.searchPlaceholder}
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setLang(lang === "en" ? "ar" : "en")} className="hidden md:block text-xs px-3 py-1.5 rounded-full font-semibold transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
            {lang === "en" ? "ع" : "EN"}
          </button>
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)" }}>{dark ? "☀️" : "🌙"}</button>
          <button onClick={() => setView("alerts")} className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unreadAlerts > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full gradient-bg" />}
          </button>
          {currentUser && (
            <button className="flex items-center gap-2 pl-1 active:scale-95 transition-all" onClick={() => { setViewUserId(currentUser.id); setView("profile"); }}>
              <div className="relative flex-shrink-0" style={{ width: 34, height: 34 }}>
                <img src={currentUser.avatar} alt={currentUser.name} className="rounded-full object-cover w-full h-full" style={{ border: "2px solid rgba(109,94,245,0.4)" }} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400" style={{ border: "2px solid var(--background)" }} />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-semibold leading-none" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{currentUser.name.split(" ")[0]}</p>
                  {currentUser.isVerified && <VerBadge color={currentUser.verificationColor} size={11} />}
                  {currentUser.isAdmin && <span className="text-xs" style={{ color: "#f59e0b" }}>🛠</span>}
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>@{currentUser.handle}</p>
              </div>
            </button>
          )}
        </div>
      </header>

      <div className="flex" style={{ maxWidth: 1280, margin: "0 auto", width: "100%", padding: "0 16px" }}>
        {/* Left sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 py-6 pr-4 flex-shrink-0" style={{ width: 220, position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto" }}>
          <div className="glass rounded-2xl p-3" style={{ border: "1px solid var(--border)" }}>
            <nav className="flex flex-col gap-0.5 py-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => handleNav(item.id, item.view)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left active:scale-95"
                  style={{ background: activeNav === item.id ? "linear-gradient(135deg,rgba(109,94,245,0.18),rgba(139,92,246,0.12))" : "transparent", color: activeNav === item.id ? "var(--primary)" : item.id === "admin" ? "#f59e0b" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  {item.badge ? <span className="ml-auto w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold">{item.badge}</span> : null}
                </button>
              ))}
            </nav>
          </div>
          {currentUser && (
            <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.yourStats}</p>
              {[{ l: t.posts, v: currentUser.postCount }, { l: t.followers, v: currentUser.followers.length }, { l: t.following, v: currentUser.following.length }, { l: t.studyHours, v: currentUser.isAdmin ? "∞" : currentUser.studyHours + "h" }].map((s) => (
                <div key={s.l} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "Inter, sans-serif" }}>{s.l}</span>
                  <span className="text-sm font-bold gradient-text" style={{ fontFamily: "Outfit, sans-serif" }}>{s.v}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main feed */}
        <main className="flex-1 py-6 px-0 md:px-4" style={{ minWidth: 0 }}>
          {/* Compose */}
          <div className="glass rounded-2xl p-4 mb-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-start gap-3">
              {currentUser && <Av src={currentUser.avatar} name={currentUser.name} size={38} />}
              <div className="flex-1">
                <textarea value={composeText} onChange={(e) => setComposeText(e.target.value)}
                  placeholder={`${t.whatsOnMind}, ${currentUser?.name.split(" ")[0]}?`}
                  rows={composeText ? 3 : 1} onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleCompose(); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--muted)", color: "var(--foreground)", fontFamily: "Inter, sans-serif", border: "1px solid var(--border)" }} />
                {composeText && (
                  <div className="flex justify-end mt-2">
                    <button onClick={handleCompose} className="gradient-bg glow text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-all" style={{ fontFamily: "Outfit, sans-serif" }}>{t.post}</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              {[t.photo, t.event, t.studyBtn, t.idea].map((label) => (
                <button key={label} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 active:scale-95" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--muted)" }}>
            {feedTabs.map((tab, i) => (
              <button key={tab} onClick={() => setFeedTab(i)} className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all active:scale-95"
                style={{ background: feedTab === i ? "var(--primary)" : "transparent", color: feedTab === i ? "#fff" : "var(--muted-foreground)", fontFamily: "Outfit, sans-serif" }}>{tab}</button>
            ))}
          </div>

          {/* Feed content */}
          {loading ? (
            <div className="flex flex-col gap-3">{[1,2,3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {(feedTab === 0 || feedTab === 1) && (
                posts.length === 0 ? <EmptyState emoji="📝" title="No posts yet" sub="Be the first to post!" />
                : posts.map((p) => <PostCard key={p.id} post={p} />)
              )}
              {(feedTab === 0 || feedTab === 2) && events.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 mt-1 px-1" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.upcomingEvents}</p>
                  <div className="flex flex-col gap-3">
                    {events.map((ev) => {
                      const going = currentUser && ev.attending.includes(currentUser.id);
                      return (
                        <div key={ev.id} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,94,245,0.15)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: ev.color + "22" }}>{ev.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div><span className="text-xs font-medium uppercase tracking-wide" style={{ color: ev.color, fontFamily: "JetBrains Mono, monospace" }}>{ev.category}</span><h3 className="font-semibold text-sm mt-0.5" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{ev.title}</h3></div>
                                <button className="text-xs px-3 py-1.5 rounded-full font-medium flex-shrink-0 active:scale-95 transition-all"
                                  style={{ background: going ? ev.color : ev.color + "18", color: going ? "#fff" : ev.color }}
                                  onClick={() => setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, attending: currentUser && going ? e.attending.filter((id) => id !== currentUser.id) : currentUser ? [...e.attending, currentUser.id] : e.attending } : e))}>
                                  {going ? t.going : t.rsvp}
                                </button>
                              </div>
                              <div className="flex gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}><span>📅 {ev.date}</span><span>🕐 {ev.time}</span><span>{ev.attending.length} {t.attending}</span></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(feedTab === 0 || feedTab === 3) && groups.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3 mt-2 px-1" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.studyGroupsLabel}</p>
                  <div className="flex flex-col gap-3">
                    {groups.map((g) => {
                      const joined = currentUser ? g.members.includes(currentUser.id) : false;
                      const fill = (g.members.length / g.maxMembers) * 100;
                      return (
                        <div key={g.id} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)", transition: "box-shadow 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(109,94,245,0.15)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div><div className="flex items-center gap-2"><h3 className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{g.name}</h3>{g.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#22c55e22", color: "#22c55e" }}>{t.activeNow}</span>}</div><p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{g.subject}</p></div>
                            <button onClick={() => setGroups((prev) => prev.map((grp) => grp.id === g.id ? { ...grp, members: joined ? grp.members.filter((id) => id !== currentUser?.id) : currentUser ? [...grp.members, currentUser.id] : grp.members } : grp))}
                              className="text-xs px-3 py-1.5 rounded-full font-medium active:scale-95 transition-all"
                              style={{ background: joined ? "var(--primary)" : "var(--secondary)", color: joined ? "#fff" : "var(--secondary-foreground)", fontFamily: "Outfit, sans-serif" }}>
                              {joined ? t.joined : t.join}
                            </button>
                          </div>
                          <div className="h-1.5 rounded-full mb-2 overflow-hidden" style={{ background: "var(--muted)" }}>
                            <div className="h-full rounded-full" style={{ width: fill + "%", background: `linear-gradient(90deg,${g.color},#a855f7)` }} />
                          </div>
                          <div className="flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}><span>{g.members.length}/{g.maxMembers} members</span><span>{t.next}: {g.nextSession}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden xl:flex flex-col gap-4 py-6 pl-4 flex-shrink-0" style={{ width: 260, position: "sticky", top: 64, height: "calc(100vh - 64px)", overflowY: "auto" }}>
          <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.trending}</p>
            <div className="flex flex-col gap-1">
              {trendingTopics.map((topic, i) => (
                <button key={topic.tag} onClick={() => { setActiveHashtag(topic.tag); setView("hashtag"); }} className="flex items-center justify-between py-2 px-2 rounded-lg hover:opacity-80 active:scale-98 transition-all w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono w-4 text-right" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
                    <span className="text-sm font-semibold" style={{ color: topic.color, fontFamily: "Outfit, sans-serif" }}>#{topic.tag}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{topic.count}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>{t.dmTitle}</p>
              <button onClick={() => setView("messages")} className="text-xs font-semibold" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>{t.seeAll}</button>
            </div>
            <div className="flex flex-col gap-1">
              {dmPreviews.map((dm) => (
                <button key={dm.userId} onClick={() => setView("messages")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-all hover:opacity-80 active:scale-98" style={{ background: "var(--muted)" }}>
                  {dm.user && <Av src={dm.user.avatar} name={dm.user.name} size={32} online />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1"><span className="text-xs font-semibold truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }}>{dm.user?.name}</span>{dm.user?.isVerified && <VerBadge color={dm.user.verificationColor} size={10} />}</div>
                    <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{dm.messages[dm.messages.length - 1]?.text}</p>
                  </div>
                  {dm.unread > 0 && <span className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{dm.unread}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontFamily: "JetBrains Mono, monospace" }}>Suggested</p>
              <button onClick={() => setView("explore")} className="text-xs font-semibold" style={{ color: "var(--primary)", fontFamily: "Outfit, sans-serif" }}>{t.seeAll}</button>
            </div>
            <div className="flex flex-col gap-3">
              {suggestedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <button onClick={() => { setViewUserId(u.id); setView("profile"); }}><Av src={u.avatar} name={u.name} size={30} /></button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1"><button className="text-xs font-semibold hover:underline truncate" style={{ fontFamily: "Outfit, sans-serif", color: "var(--foreground)" }} onClick={() => { setViewUserId(u.id); setView("profile"); }}>{u.name}</button>{u.isVerified && <VerBadge color={u.verificationColor} size={10} />}</div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>@{u.handle}</p>
                  </div>
                  <button onClick={() => followUser(u.id)} className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 active:scale-95 transition-all"
                    style={{ background: isFollowing(u.id) ? "var(--muted)" : "var(--primary)", color: isFollowing(u.id) ? "var(--muted-foreground)" : "#fff", fontFamily: "Outfit, sans-serif" }}>
                    {isFollowing(u.id) ? "✓" : t.followBtn}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden relative" style={{ height: 140, border: "1px solid var(--border)" }}>
            <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=400&h=200&fit=crop&auto=format" alt="Campus" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: "linear-gradient(to top,rgba(8,11,20,0.9),transparent 60%)" }}>
              <span className="text-xs font-medium" style={{ color: "#a855f7", fontFamily: "JetBrains Mono, monospace" }}>{t.spotlight}</span>
              <p className="text-sm font-bold text-white leading-tight mt-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>{t.spotlightText}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile nav */}
      <nav className="glass-nav lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-2 rounded-2xl z-50 glow" style={{ border: "1px solid var(--border)" }}>
        {navItems.slice(0, 5).map((item) => (
          <button key={item.id} onClick={() => handleNav(item.id, item.view)} className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-lg transition-all active:scale-90"
            style={{ background: activeNav === item.id ? "linear-gradient(135deg,rgba(109,94,245,0.25),rgba(139,92,246,0.18))" : "transparent", color: activeNav === item.id ? "var(--primary)" : "var(--muted-foreground)" }}>
            {item.icon}
            {item.badge ? <span className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold leading-none">{item.badge}</span> : null}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER + ROOT
// ═══════════════════════════════════════════════════════════════════════════════
function Router() {
  const { dark, currentUser, view } = useApp();
  return (
    <div className={dark ? "dark" : ""} style={{ minHeight: "100vh" }}>
      <GlobalToast />
      {!currentUser ? <AuthScreen /> :
       view === "profile" ? <ProfilePage /> :
       view === "settings" ? <SettingsPage /> :
       view === "admin" ? <AdminPanel /> :
       view === "explore" ? <ExploreView /> :
       view === "hashtag" ? <HashtagPage /> :
       view === "messages" ? <MessagesView /> :
       view === "alerts" ? <AlertsView /> :
       view === "events" ? <EventsView /> :
       view === "study" ? <StudyView /> :
       <FeedView />
      }
    </div>
  );
}

export default function App() {
  return <AppProvider><Router /></AppProvider>;
}
