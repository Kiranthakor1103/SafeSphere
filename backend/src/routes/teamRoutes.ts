import { Router } from 'express';
import { getVolunteers, createVolunteer, updateVolunteer, deleteVolunteer, unregisterVolunteer, getRescueTeams, createRescueTeam, updateRescueTeam, deleteRescueTeam, getNearestTeams } from '../controllers/teamController';
import { protect, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/volunteers', protect, authorizePermission('volunteers', 'view'), getVolunteers);
router.post('/volunteers/unregister', protect, unregisterVolunteer);
router.post('/volunteers', protect, authorizePermission('volunteers', 'create'), createVolunteer);
router.put('/volunteers/:id', protect, authorizePermission('volunteers', 'edit'), updateVolunteer);
router.delete('/volunteers/:id', protect, authorizePermission('volunteers', 'delete'), deleteVolunteer);

router.get('/rescue-teams', protect, authorizePermission('rescue-teams', 'view'), getRescueTeams);
router.get('/rescue-teams/nearest', protect, authorizePermission('rescue-teams', 'view'), getNearestTeams);
router.post('/rescue-teams', protect, authorizePermission('rescue-teams', 'create'), createRescueTeam);
router.put('/rescue-teams/:id', protect, authorizePermission('rescue-teams', 'edit'), updateRescueTeam);
router.delete('/rescue-teams/:id', protect, authorizePermission('rescue-teams', 'delete'), deleteRescueTeam);

export default router;
