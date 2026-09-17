import { z } from 'zod';

const password = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(72, 'كلمة المرور طويلة جداً')
  .regex(/[a-z]/, 'يجب أن تحتوي كلمة المرور على حرف صغير')
  .regex(/[A-Z]/, 'يجب أن تحتوي كلمة المرور على حرف كبير')
  .regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على رقم');

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('بريد إلكتروني غير صالح'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'اسم المستخدم قصير جداً')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'اسم المستخدم يمكن أن يحتوي فقط على أحرف إنجليزية صغيرة، أرقام، وشرطة سفلية'),
  fullName: z.string().trim().min(2, 'الاسم الكامل قصير جداً').max(100),
  password,
  universityName: z.string().trim().min(2).max(150),
  graduationYear: z.coerce.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 8),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

export const verifyOtpSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d+$/, 'الرمز يجب أن يتكون من أرقام فقط'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(10),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('بريد إلكتروني غير صالح'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32, 'رابط إعادة التعيين غير صالح.'),
  newPassword: password,
});
