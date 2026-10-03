import { Router } from 'express';
import { getMissingPersons, createMissingPerson, updateMissingPerson, deleteMissingPerson } from '../controllers/missingPersonController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorizePermission('missing-persons', 'view'), getMissingPersons);
router.post('/', protect, authorizePermission('missing-persons', 'create'), createMissingPerson);
router.put('/:id', protect, authorizePermission('missing-persons', 'edit'), updateMissingPerson);
router.delete('/:id', protect, authorizePermission('missing-persons', 'delete'), deleteMissingPerson);

export default router;
