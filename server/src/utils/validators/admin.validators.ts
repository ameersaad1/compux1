import { z } from 'zod';

export const setBannedSchema = z.object({ banned: z.boolean() });
export const setRoleSchema = z.object({ role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']) });
export const decideVerificationSchema = z.object({
  approve: z.boolean(),
  rejectionReason: z.string().max(300).optional(),
});
