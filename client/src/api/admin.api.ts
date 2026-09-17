import { apiClient } from '../lib/apiClient';

export interface AdminUserRow {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: 'STUDENT' | 'FACULTY' | 'ALUMNI' | 'MODERATOR' | 'ADMIN';
  isBanned: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  studentIdCardUrl: string | null;
  createdAt: string;
  user: { id: string; username: string; fullName: string; avatarUrl: string | null; universityName: string };
}

export interface AdminPostRow {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  author: { id: string; username: string; fullName: string; avatarUrl: string | null };
  group: { id: string; name: string } | null;
  _count: { likes: number; comments: number };
}

export const adminApi = {
  stats: () => apiClient.get<{ totalUsers: number; totalPosts: number; activeToday: number; pendingVerify: number }>('/admin/stats'),

  listUsers: (q: string, page: number) =>
    apiClient.get<{ users: AdminUserRow[]; total: number; page: number; pageSize: number }>(
      `/admin/users?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    ),

  setBanned: (userId: string, banned: boolean) => apiClient.patch<{ user: AdminUserRow }>(`/admin/users/${userId}/ban`, { banned }),

  setRole: (userId: string, role: AdminUserRow['role']) => apiClient.patch<{ user: AdminUserRow }>(`/admin/users/${userId}/role`, { role }),

  verificationRequests: () => apiClient.get<{ requests: VerificationRequest[] }>('/admin/verification-requests'),

  decideVerification: (badgeId: string, approve: boolean, rejectionReason?: string) =>
    apiClient.patch(`/admin/verification-requests/${badgeId}`, { approve, rejectionReason }),

  deletePost: (postId: string) => apiClient.delete<void>(`/admin/posts/${postId}`),

  listPosts: (q: string, page: number) =>
    apiClient.get<{ posts: AdminPostRow[]; total: number; page: number; pageSize: number }>(
      `/admin/posts?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ''}`
    ),
};
