import { Router } from 'express';
import { getDisasters, getDisaster, createDisaster, updateDisaster, deleteDisaster } from '../controllers/disasterController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorizePermission('disasters', 'view'), getDisasters);
router.get('/:id', protect, authorizePermission('disasters', 'view'), getDisaster);
router.post('/', protect, authorizePermission('disasters', 'create'), createDisaster);
router.put('/:id', protect, authorizePermission('disasters', 'edit'), updateDisaster);
router.delete('/:id', protect, authorizePermission('disasters', 'delete'), deleteDisaster);

export default router;
