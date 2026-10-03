import { Router } from 'express';
import { register, login, getMe, updateMe, getAllUsers, updateUserBySuperAdmin, deleteUserBySuperAdmin } from '../controllers/authController';
import { protect, authorize } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validate, registerValidationRules, loginValidationRules } from '../middleware/validate';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/register', authRateLimiter, validate(registerValidationRules), register);
router.post('/login', authRateLimiter, validate(loginValidationRules), login);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('image'), updateMe);
router.get('/users', protect, authorize('super_admin'), getAllUsers);
router.put('/users/:id', protect, authorize('super_admin'), updateUserBySuperAdmin);
router.delete('/users/:id', protect, authorize('super_admin'), deleteUserBySuperAdmin);

export default router;
