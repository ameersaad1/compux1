import { apiClient } from '../lib/apiClient';
import type { PublicProfile, PublicUser, CurrentUser } from '../types';

export const usersApi = {
  getProfile: (username: string) => apiClient.get<{ profile: PublicProfile }>(`/users/${username}`),

  updateProfile: (data: Partial<Pick<CurrentUser, 'fullName' | 'bio' | 'avatarUrl' | 'coverImageUrl' | 'isPrivate' | 'allowDM'>>) =>
    apiClient.patch<{ profile: CurrentUser }>('/users/me', data),

  search: (q: string) => apiClient.get<{ results: PublicUser[] }>(`/users/search?q=${encodeURIComponent(q)}`),
};

export const followApi = {
  follow: (username: string) => apiClient.post<{ status: 'PENDING' | 'ACCEPTED' }>(`/follow/${username}`),
  unfollow: (username: string) => apiClient.delete<void>(`/follow/${username}`),
  respond: (username: string, accept: boolean) => apiClient.post<{ message: string }>(`/follow/${username}/respond`, { accept }),
  followers: (username: string) => apiClient.get<{ followers: PublicUser[] }>(`/follow/${username}/followers`),
  following: (username: string) => apiClient.get<{ following: PublicUser[] }>(`/follow/${username}/following`),
};
