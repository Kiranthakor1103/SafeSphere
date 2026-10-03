import { Router } from 'express';
import { getShelters, getShelter, createShelter, updateShelter, deleteShelter, getNearestShelters } from '../controllers/shelterController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorizePermission('shelters', 'view'), getShelters);
router.get('/nearest', protect, authorizePermission('shelters', 'view'), getNearestShelters);
router.get('/:id', protect, authorizePermission('shelters', 'view'), getShelter);
router.post('/', protect, authorizePermission('shelters', 'create'), createShelter);
router.put('/:id', protect, authorizePermission('shelters', 'edit'), updateShelter);
router.delete('/:id', protect, authorizePermission('shelters', 'delete'), deleteShelter);

export default router;
