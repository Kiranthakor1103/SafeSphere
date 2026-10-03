import { Router } from 'express';
import { getResources, createResource, updateResource, deleteResource } from '../controllers/resourceController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', protect, authorizePermission('resources', 'view'), getResources);
router.post('/', protect, authorizePermission('resources', 'create'), createResource);
router.put('/:id', protect, authorizePermission('resources', 'edit'), updateResource);
router.delete('/:id', protect, authorizePermission('resources', 'delete'), deleteResource);

export default router;
