import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { presignUploadSchema } from '../utils/validators/common.validators.js';

export const uploadRouter = Router();

uploadRouter.post('/presign', requireAuth, validate(presignUploadSchema), UploadController.presign);
