import { apiClient } from '../lib/apiClient';
import type { DirectMessage, PublicUser } from '../types';

export interface ConversationSummary {
  partnerId: string;
  partner: PublicUser & { identityPublicKey: string | null };
  lastMessage: DirectMessage;
}

export const messagesApi = {
  listConversations: () => apiClient.get<{ conversations: ConversationSummary[] }>('/messages/conversations'),

  getHistory: (username: string) =>
    apiClient.get<{ partner: PublicUser & { identityPublicKey: string | null }; messages: DirectMessage[] }>(
      `/messages/${username}`
    ),
};

export const verificationApi = {
  request: (studentIdCardUrl: string) => apiClient.post('/users/me/request-verification', { studentIdCardUrl }),
};

export const publicKeyApi = {
  publish: (identityPublicKey: string) => apiClient.patch('/users/me', { identityPublicKey }),
};
