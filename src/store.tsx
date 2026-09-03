import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type React from "react";
import { supabase } from "./supabaseClient";
import type { User, Post, Event, StudyGroup, DM, Notification, Resource, Report, Badge, Lang, View } from "./types";
import { T } from "./i18n";

// ── Badge Presets ─────────────────────────────────────────────────────────────
export const ALL_BADGES: Badge[] = [
  { id: "top_student", emoji: "🌟", name: "Top Student", nameAr: "طالب متميز", desc: "Consistently achieves academic excellence", descAr: "يحقق التفوق الأكاديمي باستمرار", color: "#f59e0b", earnedAt: "Sep 2025" },
  { id: "summarizer", emoji: "📚", name: "Summary Writer", nameAr: "كاتب ملخصات", desc: "Shared 10+ academic resources with the community", descAr: "شارك 10+ مصادر أكاديمية مع المجتمع", color: "#3b82f6", earnedAt: "Aug 2025" },
  { id: "organizer", emoji: "🎯", name: "Event Organizer", nameAr: "منظم فعاليات", desc: "Organized 3+ campus events successfully", descAr: "نظّم 3+ فعاليات جامعية بنجاح", color: "#22c55e", earnedAt: "Jul 2025" },
  { id: "researcher", emoji: "🔬", name: "Researcher", nameAr: "باحث", desc: "Published or co-authored a research paper", descAr: "نشر أو شارك في ورقة بحثية", color: "#a855f7", earnedAt: "Jun 2025" },
  { id: "mentor", emoji: "🤝", name: "Peer Mentor", nameAr: "مرشد أقران", desc: "Helped 20+ students through study groups", descAr: "ساعد 20+ طالباً عبر مجموعات الدراسة", color: "#6d5ef5", earnedAt: "May 2025" },
  { id: "early", emoji: "🚀", name: "Early Adopter", nameAr: "من الأوائل", desc: "One of the first 100 Compux users", descAr: "من أوائل 100 مستخدم في كومبكس", color: "#f43f5e", earnedAt: "Jan 2025" },
];

// ── Seed Users ────────────────────────────────────────────────────────────────
export const INITIAL_USERS: User[] = [
  {
    id: "dev", email: "dev@compux.io", password: "Compux@Dev2026", name: "Dev Mode", handle: "devmode", role: "Developer",
    bio: "🛠 Developer & Owner of Compux. Full platform access.", university: "Compux HQ", faculty: "Engineering", major: "Platform Engineering",
    studyLevel: "PhD", avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=300&fit=crop&auto=format",
    isAdmin: true, isVerified: true, verificationPending: false, verificationColor: "#f59e0b",
    followers: ["u1","u2","u3"], following: ["u1","u2","u3"], postCount: 999, studyHours: 9999, badges: ALL_BADGES, github: "https://github.com", linkedin: "https://linkedin.com", phone: "+9647700000000", phoneVerified: true, showPhone: false, banned: false,
  },
  {
    id: "u1", email: "alex@uni.edu", password: "Alex1234", name: "Alex Rivera", handle: "alexrivera", role: "Senior · CS",
    bio: "CS Senior passionate about quantum computing.", university: "MIT", faculty: "School of Engineering", major: "Computer Science",
    studyLevel: "Senior", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&auto=format",
    coverUrl: "", isAdmin: false, isVerified: false, verificationPending: false, verificationColor: "#7c3aed",
    followers: ["dev","u2"], following: ["dev","u3"], postCount: 47, studyHours: 214, badges: [ALL_BADGES[0], ALL_BADGES[3]], github: "", linkedin: "", phone: "", phoneVerified: false, showPhone: false, banned: false,
  }
];

// ── Initial Seed Data ──────────────────────────────────────────────────────────
export const INITIAL_POSTS: Post[] = [
  { id: 1, authorId: "u1", time: "2m ago", content: "Compux platform connection active!", likes: 12, comments: [], shares: 2, hashtags: ["Compux", "Update"] }
];
export const INITIAL_RESOURCES: Resource[] = [];
export const INITIAL_REPORTS: Report[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_GROUPS: StudyGroup[] = [];
export const INITIAL_DMS: DM[] = [];
export const INITIAL_NOTIFICATIONS: Notification[] = [];

// ── Context Interface ─────────────────────────────────────────────────────────
interface AppState {
  lang: Lang; t: typeof T["en"]; setLang: (l: Lang) => void;
  dark: boolean; setDark: (v: boolean) => void;
  currentUser: User | null; setCurrentUser: (u: User | null) => void;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  posts: Post[]; setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  events: Event[]; setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  groups: StudyGroup[]; setGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  dms: DM[]; setDms: React.Dispatch<React.SetStateAction<DM[]>>;
  notifications: Notification[]; setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  resources: Resource[]; setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  reports: Report[]; setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  likedPosts: Set<number>; toggleLike: (postId: number) => void;
  followUser: (targetId: string) => void; isFollowing: (targetId: string) => boolean;
  getUserById: (id: string) => User | undefined;
  addPost: (content: string, hashtags: string[], image?: string) => Promise<void>;
  verifyUser: (userId: string, approve: boolean) => void;
  requestVerification: () => void; banUser: (userId: string) => void;
  deletePost: (postId: number) => void; sendDM: (toUserId: string, text: string) => void;
  updateUser: (updated: User) => void; incrementDownload: (resourceId: string) => void;
  resolveReport: (reportId: string, action: "delete" | "warn" | "dismiss") => void;
  addReport: (postId: number, reason: string) => void;
  verifyPhone: (userId: string, phone: string) => void;
  view: View; setView: (v: View) => void;
  viewUserId: string | null; setViewUserId: (id: string | null) => void;
  activeHashtag: string; setActiveHashtag: (tag: string) => void;
  toast: string; showToast: (msg: string) => void;
}

const AppCtx = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [dark, setDark] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [groups, setGroups] = useState<StudyGroup[]>(INITIAL_GROUPS);
  const [dms, setDms] = useState<DM[]>(INITIAL_DMS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [view, setView] = useState<View>("feed");
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [activeHashtag, setActiveHashtag] = useState("");
  const [toast, setToast] = useState("");

  const t = T[lang];
// ── Realtime Listener for DMs and Posts ───────────────────────────────────────
useEffect(() => {
  // 1. الاستماع التلقائي للرسائل المباشرة الجديدة
  const channel = supabase
    .channel('public-messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMsg = payload.new;
        setDms((prevDms) => {
          const senderId = newMsg.sender_id;
          const text = newMsg.content;
          const time = "الآن";

          const existing = prevDms.find((d) => d.userId === senderId);
          if (existing) {
            return prevDms.map((d) =>
              d.userId === senderId
                ? { ...d, messages: [...d.messages, { from: senderId, text, time }] }
                : d
            );
          } else {
            return [...prevDms, { userId: senderId, messages: [{ from: senderId, text, time }], unread: 1 }];
          }
        });
        showToast("رسالة جديدة أصلتك الآن!");
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  // جلب المنشورات من Supabase عند الفتح
  const fetchSupabasePosts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const fetchedPosts: Post[] = data.map((p) => ({
          id: p.id,
          authorId: p.author_id || "dev",
          time: "مؤخراً",
          content: p.content,
          image: p.media_url,
          likes: p.likes_count || 0,
          comments: [],
          shares: 0,
          hashtags: []
        }));
        setPosts(fetchedPosts);
      }
    } catch (e) {
      console.error("Supabase fetch error:", e);
    }
  }, []);

  useEffect(() => {
    fetchSupabasePosts();
  }, [fetchSupabasePosts]);

  function setLang(l: Lang) {
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  const getUserById = useCallback((id: string) => users.find((u) => u.id === id), [users]);

  const toggleLike = useCallback((postId: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }, []);

  const followUser = useCallback((targetId: string) => {
    if (!currentUser) return;
    setUsers((prev) => prev.map((u) => {
      if (u.id === currentUser.id) {
        const already = u.following.includes(targetId);
        return { ...u, following: already ? u.following.filter((id) => id !== targetId) : [...u.following, targetId] };
      }
      return u;
    }));
  }, [currentUser]);

  const isFollowing = useCallback((targetId: string) => currentUser?.following.includes(targetId) ?? false, [currentUser]);

  const updateUser = useCallback((updated: User) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    setCurrentUser((prev) => prev?.id === updated.id ? updated : prev);
  }, []);

  const addPost = useCallback(async (content: string, hashtags: string[], image?: string) => {
    if (!currentUser) return;

    // 1. إضافة للمستودع الحقيقي Supabase
    try {
      const { data } = await supabase.from('posts').insert([
        { author_id: currentUser.id, content, media_url: image || null, likes_count: 0 }
      ]).select();

      const newId = data && data[0] ? data[0].id : Date.now();
      const newPost: Post = {
        id: newId,
        authorId: currentUser.id,
        time: "الآن",
        content,
        image,
        likes: 0,
        comments: [],
        shares: 0,
        hashtags
      };
      setPosts((prev) => [newPost, ...prev]);
      updateUser({ ...currentUser, postCount: currentUser.postCount + 1 });
      showToast("تم نشر المنشور وحفظه بنجاح!");
    } catch {
      showToast("حدث خطأ في حفظ المنشور.");
    }
  }, [currentUser, updateUser]);

  const verifyUser = useCallback((userId: string, approve: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isVerified: approve, verificationPending: false } : u));
  }, []);

  const requestVerification = useCallback(() => {
    if (!currentUser) return;
    updateUser({ ...currentUser, verificationPending: true });
  }, [currentUser, updateUser]);

  const banUser = useCallback((userId: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned: !u.banned } : u));
  }, []);

  const deletePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const sendDM = useCallback((toUserId: string, text: string) => {
    if (!currentUser) return;
    setDms((prev) => {
      const msg = { from: currentUser.id, text, time: "now" };
      const ex = prev.find((d) => d.userId === toUserId);
      if (ex) return prev.map((d) => d.userId === toUserId ? { ...d, messages: [...d.messages, msg] } : d);
      return [...prev, { userId: toUserId, messages: [msg], unread: 0 }];
    });
  }, [currentUser]);

  const incrementDownload = useCallback((resourceId: string) => {
    setResources((prev) => prev.map((r) => r.id === resourceId ? { ...r, downloads: r.downloads + 1 } : r));
  }, []);

  const resolveReport = useCallback((reportId: string, action: "delete" | "warn" | "dismiss") => {
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: action === "dismiss" ? "dismissed" : "resolved" } : r));
    if (action === "delete") {
      const rep = reports.find((r) => r.id === reportId);
      if (rep) deletePost(rep.postId);
    }
  }, [reports, deletePost]);

  const addReport = useCallback((postId: number, reason: string) => {
    if (!currentUser) return;
    setReports((prev) => [...prev, { id: "rep_" + Date.now(), postId, reportedBy: currentUser.id, reason, status: "pending", createdAt: "just now" }]);
    showToast("Report submitted");
  }, [currentUser]);

  const verifyPhone = useCallback((userId: string, phone: string) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, phone, phoneVerified: true } : u));
    setCurrentUser((prev) => prev?.id === userId ? { ...prev, phone, phoneVerified: true } : prev);
    showToast("Phone verified successfully!");
  }, []);

  return (
    <AppCtx.Provider value={{
      lang, t: t as typeof T["en"], setLang, dark, setDark, currentUser, setCurrentUser,
      users, setUsers, posts, setPosts, events, setEvents, groups, setGroups, dms, setDms,
      notifications, setNotifications, resources, setResources, reports, setReports,
      likedPosts, toggleLike, followUser, isFollowing, getUserById, addPost, verifyUser,
      requestVerification, banUser, deletePost, sendDM, updateUser, incrementDownload,
      resolveReport, addReport, verifyPhone, view, setView, viewUserId, setViewUserId,
      activeHashtag, setActiveHashtag, toast, showToast
    }}>
      {children}
    </AppCtx.Provider>
  );
}
