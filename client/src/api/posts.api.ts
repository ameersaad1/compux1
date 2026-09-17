import { apiClient } from '../lib/apiClient';
import type { Post, Comment } from '../types';

export const postsApi = {
  getFeed: (cursor?: string) => apiClient.get<{ posts: Post[]; nextCursor: string | null }>(
    `/posts/feed${cursor ? `?cursor=${cursor}` : ''}`
  ),

  getUserPosts: (username: string, cursor?: string) =>
    apiClient.get<{ posts: Post[]; nextCursor: string | null }>(
      `/posts/user/${username}${cursor ? `?cursor=${cursor}` : ''}`
    ),

  getGroupPosts: (groupId: string, cursor?: string) =>
    apiClient.get<{ posts: Post[]; nextCursor: string | null }>(
      `/posts/group/${groupId}${cursor ? `?cursor=${cursor}` : ''}`
    ),

  create: (content: string, mediaUrls: string[] = [], groupId?: string) =>
    apiClient.post<{ post: Post }>('/posts', { content, mediaUrls, groupId }),

  remove: (postId: string) => apiClient.delete<void>(`/posts/${postId}`),

  toggleLike: (postId: string) => apiClient.post<{ liked: boolean; likesCount: number }>(`/posts/${postId}/like`),

  getComments: (postId: string) => apiClient.get<{ comments: Comment[] }>(`/posts/${postId}/comments`),

  addComment: (postId: string, content: string, parentId?: string) =>
    apiClient.post<{ comment: Comment }>(`/posts/${postId}/comments`, { content, parentId }),
};
