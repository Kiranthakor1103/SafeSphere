import { Router } from 'express';
import { getDashboardStats } from '../controllers/analyticsController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/dashboard', protect, authorizePermission('dashboard', 'view'), getDashboardStats);

export default router;
