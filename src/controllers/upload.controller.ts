import { Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from './authAndPrivacy.controller';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export class UploadController {
  static async getPresignedUploadUrl(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { fileType, fileCategory } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'يلزم تسجيل الدخول للقيام بهذه العملية.' });
      }

      const allowedCategories = ['avatars', 'covers', 'posts', 'verification_ids'];
      if (!allowedCategories.includes(fileCategory)) {
        return res.status(400).json({ error: 'تصنيف الملف غير صالح.' });
      }

      const allowedMimeTypes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      };

      if (!allowedMimeTypes[fileType]) {
        return res.status(400).json({ error: 'صيغة الملف غير مدعومة. يرجى اختيار صورة صالحة.' });
      }

      const fileExtension = allowedMimeTypes[fileType];
      const key = `${fileCategory}/${userId}/${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return res.status(200).json({
        uploadUrl,
        publicUrl,
        key,
      });
    } catch (error) {
      return next(error);
    }
  }
}
