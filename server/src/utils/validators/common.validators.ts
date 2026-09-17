import { z } from 'zod';

/**
 * `z.string().url()` accepts any syntactically valid URL, including
 * `javascript:`/`data:` schemes - values that would never be rendered
 * dangerously via <img>/CSS background-image today, but there's no reason
 * to accept them at the boundary at all. Every URL a user submits for us to
 * store and later render (avatar, cover, post media, ID card) is pinned to
 * http/https here so that stays true even as new UI is added later.
 */
const httpUrl = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value), { message: 'يجب أن يكون الرابط عبر http أو https.' });

export const createPostSchema = z.object({
  content: z.string().max(3000),
  mediaUrls: z.array(httpUrl).max(10).optional().default([]),
  groupId: z.string().uuid().optional(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  bio: z.string().trim().max(500).optional(),
  avatarUrl: httpUrl.optional(),
  coverImageUrl: httpUrl.optional(),
  isPrivate: z.boolean().optional(),
  allowDM: z.enum(['EVERYONE', 'FOLLOWERS_ONLY', 'NONE']).optional(),
  identityPublicKey: z.string().min(20).max(2000).optional(),
});

export const requestVerificationSchema = z.object({
  studentIdCardUrl: httpUrl,
});

export const respondFollowSchema = z.object({
  accept: z.boolean(),
});

export const presignUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

export const createEventSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(3).max(2000),
  location: z.string().trim().min(2).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.coerce.number().int().positive().max(5000),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
  isPrivate: z.boolean().optional().default(false),
});
