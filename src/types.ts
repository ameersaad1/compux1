export type Lang = "en" | "ar";
export type View =
  | "feed" | "profile" | "settings" | "admin"
  | "explore" | "hashtag" | "messages" | "alerts"
  | "events" | "study";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  color: string;
  earnedAt: string;
}

export interface Resource {
  id: string;
  title: string;
  subject: string;
  fileType: "pdf" | "doc" | "ppt" | "xlsx";
  downloads: number;
  uploadedBy: string; // userId
  uploadedAt: string;
  url: string;
}

export interface Report {
  id: string;
  postId: number;
  reportedBy: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface Comment {
  id: number;
  authorId: string;
  text: string;
  time: string;
  likes: number;
  replies: Comment[];
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  handle: string;
  role: string;
  bio: string;
  university: string;
  faculty: string;
  major: string;
  studyLevel: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Masters" | "PhD" | "";
  avatar: string;
  coverUrl: string;
  isAdmin: boolean;
  isVerified: boolean;
  verificationPending: boolean;
  verificationColor: string;
  followers: string[];
  following: string[];
  postCount: number;
  studyHours: number;
  badges: Badge[];
  github?: string;
  linkedin?: string;
  phone?: string;
  phoneVerified: boolean;
  showPhone: boolean;
  banned: boolean;
}

export interface Post {
  id: number;
  authorId: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: Comment[];
  shares: number;
  hashtags: string[];
  tag?: string;
  tagColor?: string;
  pinned?: boolean;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  attending: string[];
  color: string;
  emoji: string;
  category: string;
  description: string;
  hashtags: string[];
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  members: string[];
  maxMembers: number;
  nextSession: string;
  color: string;
  active: boolean;
}

export interface DM {
  userId: string;
  messages: { from: string; text: string; time: string }[];
  unread: number;
}

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "event" | "verify";
  fromId: string;
  text: string;
  time: string;
  read: boolean;
}
