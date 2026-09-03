import { supabase } from "./supabase";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User, Post, Event, StudyGroup, DM, Notification, Resource, Report, Badge } from "./types";
import type { Lang, View } from "./types";
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
    id: "dev", email: "dev@compux.io", password: "Compux@Dev2026",
    name: "Dev Mode", handle: "devmode", role: "Developer",
    bio: "🛠 Developer & Owner of Compux. Full platform access. Building the future of campus social networks.",
    university: "Compux HQ", faculty: "Engineering", major: "Platform Engineering", studyLevel: "PhD",
    avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=300&fit=crop&auto=format",
    isAdmin: true, isVerified: true, verificationPending: false, verificationColor: "#f59e0b",
    followers: ["u1","u2","u3"], following: ["u1","u2","u3"],
    postCount: 999, studyHours: 9999,
    badges: ALL_BADGES,
    github: "https://github.com", linkedin: "https://linkedin.com",
    phone: "+964 770 000 0001", phoneVerified: true, showPhone: false, banned: false,
  },
  {
    id: "u1", email: "alex@uni.edu", password: "Alex1234",
    name: "Alex Rivera", handle: "alexrivera", role: "Senior · CS",
    bio: "CS Senior passionate about quantum computing and distributed systems. Research paper in review at IEEE. Coffee addict. ☕",
    university: "MIT", faculty: "School of Engineering", major: "Computer Science", studyLevel: "Senior",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=300&fit=crop&auto=format",
    isAdmin: false, isVerified: false, verificationPending: false, verificationColor: "#7c3aed",
    followers: ["dev","u2"], following: ["dev","u3"],
    postCount: 47, studyHours: 214,
    badges: [ALL_BADGES[0], ALL_BADGES[3], ALL_BADGES[5]],
    github: "https://github.com", linkedin: "",
    phone: "", phoneVerified: false, showPhone: false, banned: false,
  },
  {
    id: "u2", email: "priya@uni.edu", password: "Priya1234",
    name: "Priya Sharma", handle: "priya_s", role: "PhD · Quantum",
    bio: "PhD student in Quantum Computing. IEEE member. Research on quantum error correction and topological qubits. 🧬",
    university: "MIT", faculty: "School of Science", major: "Quantum Computing", studyLevel: "PhD",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=900&h=300&fit=crop&auto=format",
    isAdmin: false, isVerified: true, verificationPending: false, verificationColor: "#7c3aed",
    followers: ["dev","u1","u3"], following: ["dev","u1"],
    postCount: 89, studyHours: 512,
    badges: [ALL_BADGES[0], ALL_BADGES[1], ALL_BADGES[3], ALL_BADGES[4]],
    github: "", linkedin: "https://linkedin.com",
    phone: "+1 617 000 0002", phoneVerified: true, showPhone: false, banned: false,
  },
  {
    id: "u3", email: "marcus@uni.edu", password: "Marcus1234",
    name: "Marcus Osei", handle: "marcusosei", role: "Junior · Design",
    bio: "Product Designer & CS student. Building tools that make learning beautiful. Photography enthusiast 📷",
    university: "Stanford", faculty: "d.school", major: "HCI + Design", studyLevel: "Junior",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=300&fit=crop&auto=format",
    isAdmin: false, isVerified: false, verificationPending: true, verificationColor: "#7c3aed",
    followers: ["dev","u2"], following: ["dev","u2"],
    postCount: 34, studyHours: 178,
    badges: [ALL_BADGES[2], ALL_BADGES[5]],
    github: "https://github.com", linkedin: "https://linkedin.com",
    phone: "", phoneVerified: false, showPhone: false, banned: false,
  },
  {
    id: "u4", email: "elena@uni.edu", password: "Elena1234",
    name: "Elena Vasquez", handle: "elena_v", role: "Senior · BioEng",
    bio: "Bioengineering senior. iGEM champion 🏆. CRISPR biosensor research. MIT class of 2027.",
    university: "MIT", faculty: "School of Engineering", major: "Bioengineering", studyLevel: "Senior",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format",
    coverUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=900&h=300&fit=crop&auto=format",
    isAdmin: false, isVerified: true, verificationPending: false, verificationColor: "#7c3aed",
    followers: ["dev","u1","u2","u3"], following: ["dev","u1"],
    postCount: 128, studyHours: 341,
    badges: [ALL_BADGES[0], ALL_BADGES[2], ALL_BADGES[3], ALL_BADGES[4]],
    github: "", linkedin: "https://linkedin.com",
    phone: "+1 617 000 0004", phoneVerified: true, showPhone: true, banned: false,
  },
];

// ── Seed Posts ────────────────────────────────────────────────────────────────
export const INITIAL_POSTS: Post[] = [
  {
    id: 1, authorId: "u2", time: "2m ago",
    content: "Just finished my quantum computing research paper! 🎉 Three months of late nights. Huge thanks to the CS Lab study group — you all are legends. Submitting to IEEE tomorrow! 🤞",
    likes: 141, comments: [
      { id: 101, authorId: "u1", text: "This is incredible, congrats Priya! 🎉", time: "1m", likes: 5, replies: [
        { id: 1011, authorId: "u2", text: "Thank you so much Alex! Couldn't have done it without the study group 🙏", time: "30s", likes: 2, replies: [] }
      ]},
      { id: 102, authorId: "u4", text: "IEEE is lucky to have this paper. Share the draft when you can!", time: "45s", likes: 3, replies: [] },
    ],
    shares: 14, hashtags: ["QuantumComputing","Research","IEEE","MITLife"], tag: "Research", tagColor: "#6d5ef5",
  },
  {
    id: 2, authorId: "u3", time: "18m ago",
    content: "The Sutardja Dai Hall rooftop is the best study spot on campus 🌅 Got here at 6am, had the whole place to myself. Coffee + sunrise + algorithms = perfect morning. #StudyHacks #CampusLife",
    image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&h=280&fit=crop&auto=format",
    likes: 88, comments: [
      { id: 201, authorId: "u1", text: "That view is unreal. See you there tomorrow?", time: "15m", likes: 4, replies: [] },
    ],
    shares: 5, hashtags: ["StudyHacks","CampusLife","Stanford"], tag: "Campus Life", tagColor: "#f59e0b",
  },
  {
    id: 3, authorId: "u4", time: "1h ago",
    content: "Our bioengineering team just won the MIT iGEM competition! 🏆 We designed a biosensor that detects early-stage Alzheimer's markers with 94% accuracy using CRISPR. Beyond grateful. 🧬 #iGEM #BioEng #Research",
    likes: 511, comments: [],
    shares: 98, hashtags: ["iGEM","BioEng","Research","MITLife","CRISPR"], tag: "Achievement", tagColor: "#22c55e",
  },
  {
    id: 4, authorId: "u1", time: "3h ago",
    content: "Just submitted my internship application to SpaceX and Google DeepMind simultaneously 🚀🤖 Both due today at midnight — cutting it close! Fingers crossed. #CareerAdvice #Internship #CS",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=280&fit=crop&auto=format",
    likes: 204, comments: [], shares: 31, hashtags: ["CareerAdvice","Internship","CS","MITLife"], tag: "Career", tagColor: "#3b82f6",
  },
  {
    id: 5, authorId: "dev", time: "6h ago",
    content: "🚀 Compux v3.0 is live! Phone verification, media grids, admin analytics, and gamification badges. More coming next week. #Compux #CampusLife",
    likes: 892, comments: [], shares: 203, hashtags: ["Compux","CampusLife","NewFeature"], tag: "Platform", tagColor: "#f59e0b", pinned: true,
  },
];

// ── Seed Resources ────────────────────────────────────────────────────────────
export const INITIAL_RESOURCES: Resource[] = [
  { id: "r1", title: "Quantum Error Correction — Complete Notes", subject: "Quantum Computing", fileType: "pdf", downloads: 234, uploadedBy: "u2", uploadedAt: "Sep 1, 2026", url: "#" },
  { id: "r2", title: "Machine Learning Cheat Sheet v4", subject: "ML / AI", fileType: "pdf", downloads: 512, uploadedBy: "u1", uploadedAt: "Aug 28, 2026", url: "#" },
  { id: "r3", title: "CRISPR Biosensor Research Summary", subject: "Bioengineering", fileType: "doc", downloads: 189, uploadedBy: "u4", uploadedAt: "Aug 25, 2026", url: "#" },
  { id: "r4", title: "HCI Design Patterns — Slide Deck", subject: "Design", fileType: "ppt", downloads: 97, uploadedBy: "u3", uploadedAt: "Aug 20, 2026", url: "#" },
  { id: "r5", title: "Algorithms Final Exam Prep", subject: "Computer Science", fileType: "pdf", downloads: 341, uploadedBy: "u1", uploadedAt: "Aug 15, 2026", url: "#" },
];

// ── Seed Reports ──────────────────────────────────────────────────────────────
export const INITIAL_REPORTS: Report[] = [
  { id: "rep1", postId: 4, reportedBy: "u3", reason: "Misleading information about internship", status: "pending", createdAt: "1h ago" },
  { id: "rep2", postId: 2, reportedBy: "u4", reason: "Spam content", status: "pending", createdAt: "3h ago" },
  { id: "rep3", postId: 1, reportedBy: "u3", reason: "Off-topic for academic network", status: "dismissed", createdAt: "1d ago" },
];

export const INITIAL_EVENTS: Event[] = [
  { id: 1, title: "Compux Campus Hackathon 2026", date: "Sep 12", time: "9:00 AM", location: "Main Auditorium", attending: ["dev","u1","u2"], color: "#6d5ef5", emoji: "💻", category: "Hackathon", description: "48-hour hackathon open to all students. Prizes worth $10,000. Teams of 2–4.", hashtags: ["HackathonMIT","Compux"] },
  { id: 2, title: "Study Group: Advanced ML Methods", date: "Sep 5", time: "3:00 PM", location: "Library, Room 204", attending: ["u1","u2"], color: "#3b82f6", emoji: "🧠", category: "Study", description: "Deep dive into transformer architectures and RLHF. Bring your laptops.", hashtags: ["StudyHacks","ML"] },
  { id: 3, title: "Career Fair — Top 50 Tech Companies", date: "Sep 8", time: "10:00 AM", location: "Student Union", attending: ["u1","u3","u4"], color: "#f59e0b", emoji: "🏢", category: "Career", description: "Google, Apple, Meta, SpaceX, Anthropic and 45 more companies recruiting on campus.", hashtags: ["CareerAdvice","Internship"] },
  { id: 4, title: "Campus Sustainability Week Kickoff", date: "Sep 9", time: "11:00 AM", location: "Green Lawn", attending: ["u2","u4"], color: "#22c55e", emoji: "🌱", category: "Community", description: "Join us for a week of sustainability workshops, panel discussions, and campus cleanups.", hashtags: ["CampusFest2026","Sustainability"] },
];

export const INITIAL_GROUPS: StudyGroup[] = [
  { id: "g1", name: "CS 189 — ML Prep Squad", subject: "Machine Learning", members: ["u1","u2","u3"], maxMembers: 10, nextSession: "Today, 4pm", color: "#6d5ef5", active: true },
  { id: "g2", name: "Quantum Computing Theory", subject: "Physics + CS Intersection", members: ["u2","u4"], maxMembers: 6, nextSession: "Thu, Sep 4", color: "#a855f7", active: false },
  { id: "g3", name: "BioEng Research Collective", subject: "Bioengineering & CRISPR", members: ["u4","u1"], maxMembers: 8, nextSession: "Fri, Sep 6", color: "#22c55e", active: false },
];

export const INITIAL_DMS: DM[] = [
  { userId: "u2", messages: [{ from: "u2", text: "Hey! Are you joining the hackathon?", time: "2m" },{ from: "u1", text: "Yes! Already signed up. You?", time: "1m" },{ from: "u2", text: "Of course! Want to team up? 🚀", time: "30s" }], unread: 1 },
  { userId: "u4", messages: [{ from: "u4", text: "Did you see the iGEM results? We won! 🏆", time: "15m" },{ from: "u1", text: "Congrats!! That's incredible!", time: "12m" }], unread: 0 },
  { userId: "u3", messages: [{ from: "u3", text: "The project deadline was pushed to Friday", time: "1h" }], unread: 1 },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "like", fromId: "u2", text: "Priya liked your post about SpaceX application", time: "5m", read: false },
  { id: 2, type: "follow", fromId: "u4", text: "Elena started following you", time: "20m", read: false },
  { id: 3, type: "comment", fromId: "u3", text: "Marcus commented on your ML study group post", time: "1h", read: false },
  { id: 4, type: "event", fromId: "dev", text: "Compux Hackathon 2026 starts in 10 days!", time: "2h", read: true },
  { id: 5, type: "verify", fromId: "dev", text: "Your verification request is under review", time: "1d", read: true },
];

// ── Analytics mock data ────────────────────────────────────────────────────────
export const ANALYTICS = {
  dailyUsers: [12, 18, 24, 31, 28, 42, 55, 48, 61, 72, 68, 85, 91, 78],
  dailyPosts: [4, 8, 11, 15, 13, 19, 24, 21, 28, 33, 30, 38, 41, 35],
  labels: ["Aug 21","22","23","24","25","26","27","28","29","30","31","Sep 1","2","3"],
};

// ── Context ────────────────────────────────────────────────────────────────────
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
  addPost: (content: string, hashtags: string[], image?: string) => void;
  verifyUser: (userId: string, approve: boolean) => void;
  requestVerification: () => void;
  banUser: (userId: string) => void;
  deletePost: (postId: number) => void;
  sendDM: (toUserId: string, text: string) => void;
  updateUser: (updated: User) => void;
  incrementDownload: (resourceId: string) => void;
  resolveReport: (reportId: string, action: "delete" | "warn" | "dismiss") => void;
  addReport: (postId: number, reason: string) => void;
  verifyPhone: (userId: string, phone: string) => void;
  view: View; setView: (v: View) => void;
  viewUserId: string | null; setViewUserId: (id: string | null) => void;
  activeHashtag: string; setActiveHashtag: (tag: string) => void;
  toast: string; showToast: (msg: string) => void;
}

import type React from "react";

const AppCtx = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [dark, setDark] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
      if (next.has(postId)) next.delete(postId); else next.add(postId);
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
      if (u.id === targetId) {
        const already = u.followers.includes(currentUser.id);
        return { ...u, followers: already ? u.followers.filter((id) => id !== currentUser.id) : [...u.followers, currentUser.id] };
      }
      return u;
    }));
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const already = prev.following.includes(targetId);
      return { ...prev, following: already ? prev.following.filter((id) => id !== targetId) : [...prev.following, targetId] };
    });
  }, [currentUser]);

  const isFollowing = useCallback((targetId: string) => {
    return currentUser?.following.includes(targetId) ?? false;
  }, [currentUser]);

  const updateUser = useCallback((updated: User) => {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    setCurrentUser((prev) => prev?.id === updated.id ? updated : prev);
  }, []);

  const addPost = useCallback((content: string, hashtags: string[], image?: string) => {
    if (!currentUser) return;
    const newPost: Post = { id: Date.now(), authorId: currentUser.id, time: "just now", content, image, likes: 0, comments: [], shares: 0, hashtags };
    setPosts((prev) => [newPost, ...prev]);
    updateUser({ ...currentUser, postCount: currentUser.postCount + 1 });
  }, [currentUser, updateUser]);

  const verifyUser = useCallback((userId: string, approve: boolean) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isVerified: approve, verificationPending: false } : u));
    setNotifications((prev) => [{
      id: Date.now(), type: "verify", fromId: "dev",
      text: approve ? "✓ Your account has been verified!" : "Your verification request was not approved.",
      time: "now", read: false,
    }, ...prev]);
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
      lang, t: t as typeof T["en"], setLang, dark, setDark,
      currentUser, setCurrentUser, users, setUsers, posts, setPosts,
      events, setEvents, groups, setGroups, dms, setDms,
      notifications, setNotifications, resources, setResources, reports, setReports,
      likedPosts, toggleLike, followUser, isFollowing, getUserById,
      addPost, verifyUser, requestVerification, banUser, deletePost, sendDM,
      updateUser, incrementDownload, resolveReport, addReport, verifyPhone,
      view, setView, viewUserId, setViewUserId, activeHashtag, setActiveHashtag,
      toast, showToast,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
