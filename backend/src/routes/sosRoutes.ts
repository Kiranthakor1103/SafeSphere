import { Router } from 'express';
import { getSOSAlerts, getSOSAlert, createSOSAlert, updateSOSAlert, deleteSOSAlert, getNearestSOS, dispatchTeamToSOS } from '../controllers/sosController';
import { protect, authorizePermission } from '../middleware/auth';
import { sosRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', protect, authorizePermission('sos', 'view'), getSOSAlerts);
router.get('/nearest', protect, authorizePermission('sos', 'view'), getNearestSOS);
router.get('/:id', protect, authorizePermission('sos', 'view'), getSOSAlert);
router.post('/', protect, sosRateLimiter, authorizePermission('sos', 'create'), createSOSAlert);
router.post('/:id/dispatch', protect, authorizePermission('sos', 'edit'), dispatchTeamToSOS);
router.put('/:id', protect, authorizePermission('sos', 'edit'), updateSOSAlert);
router.delete('/:id', protect, authorizePermission('sos', 'delete'), deleteSOSAlert);

export default router;
