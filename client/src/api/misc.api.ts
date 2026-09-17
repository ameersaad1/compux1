import { apiClient } from '../lib/apiClient';
import type { StudyGroup, GroupMember, CampusEvent, AppNotification } from '../types';

export const groupsApi = {
  list: (q?: string) => apiClient.get<{ groups: StudyGroup[] }>(`/groups${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getOne: (groupId: string) => apiClient.get<{ group: StudyGroup & { myRole: string | null } }>(`/groups/${groupId}`),
  create: (name: string, description: string, isPrivate: boolean) =>
    apiClient.post<{ group: StudyGroup }>('/groups', { name, description, isPrivate }),
  join: (groupId: string) => apiClient.post<{ group: StudyGroup }>(`/groups/${groupId}/join`),
  leave: (groupId: string) => apiClient.post<{ message: string }>(`/groups/${groupId}/leave`),
  members: (groupId: string) => apiClient.get<{ members: GroupMember[] }>(`/groups/${groupId}/members`),
  addMember: (groupId: string, userId: string) =>
    apiClient.post<{ group: StudyGroup }>(`/groups/${groupId}/members/${userId}`),
};

export const eventsApi = {
  list: (groupId?: string) => apiClient.get<{ events: CampusEvent[] }>(`/events${groupId ? `?groupId=${groupId}` : ''}`),
  create: (payload: Omit<CampusEvent, 'id' | 'filledSeats'>) => apiClient.post<{ event: CampusEvent }>('/events', payload),
  rsvp: (eventId: string) => apiClient.post<{ event: CampusEvent }>(`/events/${eventId}/rsvp`),
  cancelRsvp: (eventId: string) => apiClient.delete<void>(`/events/${eventId}/rsvp`),
};

export const notificationsApi = {
  list: () => apiClient.get<{ notifications: AppNotification[]; unreadCount: number }>('/notifications'),
  markAllRead: () => apiClient.post<{ message: string }>('/notifications/read-all'),
};

export const uploadsApi = {
  presign: (fileName: string, contentType: string, fileSizeBytes: number) =>
    apiClient.post<{ uploadUrl: string; publicUrl: string; key: string }>('/uploads/presign', {
      fileName,
      contentType,
      fileSizeBytes,
    }),

  /** Uploads the raw file bytes directly to S3 using the presigned URL, then returns the public URL. */
  async uploadFile(file: File): Promise<string> {
    const { uploadUrl, publicUrl } = await uploadsApi.presign(file.name, file.type, file.size);
    const res = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    if (!res.ok) throw new Error('فشل رفع الملف.');
    return publicUrl;
  },
};
