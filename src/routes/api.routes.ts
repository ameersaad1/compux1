import { Router } from 'express';
import { AuthController, authorizePrivateProfileAccess } from '../controllers/authAndPrivacy.controller';
import { UploadController } from '../controllers/upload.controller';
import { EventController } from '../controllers/event.controller';

const router = Router();

// مسارات المصادقة
router.post('/auth/google', AuthController.authenticateWithGoogle);
router.post('/auth/register', AuthController.registerUser);
router.post('/auth/otp/request', AuthController.requestEmailOTP);

// مسارات الرفع المباشر إلى S3
router.post('/upload/presigned-url', UploadController.getPresignedUploadUrl);

// مسارات الحسابات المخصصة والوصول الخصوصي
router.get('/profile/:targetUserId', authorizePrivateProfileAccess, (req, res) => {
  return res.status(200).json({ message: 'تم الوصول إلى بيانات الملف الشخصي بنجاح.' });
});

// مسارات الفعاليات المحمية بقفل التنافسية
router.post('/events/:eventId/rsvp', EventController.rsvpToEvent);

export default router;
