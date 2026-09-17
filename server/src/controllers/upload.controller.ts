import { UploadService } from '../services/upload.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export class UploadController {
  static presign = asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fileName, contentType, fileSizeBytes } = req.body;
    const result = await UploadService.createPresignedUpload(req.user!.userId, fileName, contentType, fileSizeBytes);
    res.json(result);
  });
}
