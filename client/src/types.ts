export type Lang = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type Role = 'STUDENT' | 'FACULTY' | 'ALUMNI' | 'MODERATOR' | 'ADMIN';
export type AllowDM = 'EVERYONE' | 'FOLLOWERS_ONLY' | 'NONE';

export interface PublicUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface CurrentUser extends PublicUser {
  email: string;
  emailVerifiedAt: string | null;
  bio: string | null;
  coverImageUrl: string | null;
  universityName: string;
  graduationYear: number;
  role: Role;
  isPrivate: boolean;
  allowDM: AllowDM;
  createdAt: string;
  verificationBadge: { status: string } | null;
  identityPublicKey: string | null;
  _count: { followers: number; following: number; posts: number };
}

export interface PublicProfile extends Omit<CurrentUser, 'email' | 'emailVerifiedAt' | 'allowDM'> {
  isFollowing: boolean;
  followStatus: 'PENDING' | 'ACCEPTED' | null;
  isOwnProfile: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author: PublicUser;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  isLikedByViewer?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: PublicUser;
  content: string;
  parentId: string | null;
  replies?: Comment[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'MENTION' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPT' | 'EVENT_REMINDER' | 'GROUP_INVITE';
  actor: PublicUser;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CampusEvent {
  id: string;
  groupId: string;
  group?: { id: string; name: string; avatarUrl: string | null };
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  capacity: number;
  filledSeats: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  memberCount: number;
  maxMembers: number;
  creatorId?: string;
  _count?: { members: number; posts: number; events: number };
}

export type GroupRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
  user: PublicUser;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  sender: PublicUser;
  encryptedContent: string;
  iv: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: { field: string; message: string }[];
}
