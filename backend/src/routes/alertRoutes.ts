import { Router } from 'express';
import { getAlerts, createAlert, updateAlert, deleteAlert, deactivateAlert } from '../controllers/alertController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorizePermission('alerts', 'view'), getAlerts);
router.post('/', protect, authorizePermission('alerts', 'create'), createAlert);
router.put('/:id', protect, authorizePermission('alerts', 'edit'), updateAlert);
router.delete('/:id', protect, authorizePermission('alerts', 'delete'), deleteAlert);
router.put('/:id/deactivate', protect, authorizePermission('alerts', 'delete'), deactivateAlert);

export default router;
