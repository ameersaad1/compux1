import { Request, Response, NextFunction } from 'express';
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
  /**
   * توليد رابط رفع مؤقت لرفع الصور مباشرة إلى S3
   */
  static async getPresignedUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { fileType, fileCategory } = req.body; // e.g. fileType: 'image/jpeg', fileCategory: 'avatars' | 'posts'
      const userId = req.user?.userId;

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: 'نوع الملف غير مدعوم. يرجى رفع صورة بصيغة صالحة.' });
      }

      const fileExtension = fileType.split('/')[1];
      const key = `${fileCategory}/${userId}/${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
      });

      // رابط صالح لمدة 5 دقائق فقط
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return res.status(200).json({
        uploadUrl,
        publicUrl,
        key,
      });
    } catch (error) {
      next(error);
    }
  }
}
