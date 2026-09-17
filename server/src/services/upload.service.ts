import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const s3 = new S3Client({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? { credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY } }
    : {}),
});

/**
 * The server never proxies file bytes: it hands the browser a short-lived,
 * signed URL that is valid for exactly one PUT of one object, so uploads go
 * directly client -> S3 without loading the API server or its memory.
 */
export class UploadService {
  static async createPresignedUpload(userId: string, fileName: string, contentType: string, fileSizeBytes: number) {
    if (!env.AWS_S3_BUCKET) throw AppError.badRequest('التخزين السحابي غير مُهيّأ على الخادم.');
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      throw AppError.badRequest('نوع الملف غير مدعوم. الأنواع المسموحة: JPEG, PNG, WEBP, GIF.');
    }
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw AppError.badRequest('حجم الملف يتجاوز الحد الأقصى المسموح (8 ميجابايت).');
    }

    const safeExtension = (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `uploads/${userId}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSizeBytes,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
