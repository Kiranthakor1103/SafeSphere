import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Upload endpoint
router.post('/', protect, upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please select a file to upload.', 400);
  }

  const host = req.get('host');
  const protocol = req.protocol;
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    message: 'File uploaded successfully!',
    url: fileUrl
  });
});

export default router;
