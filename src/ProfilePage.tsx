
import { useState, useEffect } from "react";
import { useApp } from "../store";
import { Av, VerBadge, SkeletonCard, EmptyState } from "../components/primitives";
import { LightboxModal } from "../components/modals/LightboxModal";
import { BadgeModal } from "../components/modals/BadgeModal";
import { FollowModal } from "../components/modals/FollowModal";
import { PostCard } from "../components/PostCard";
import { ResourceItem } from "../components/ResourceItem";
import type { User, Badge } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE — full tabs
// ═══════════════════════════════════════════════════════════════════════════════
export function ProfilePage() {
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
EOF
echo "ProfilePage written"
Output

ProfilePage written
