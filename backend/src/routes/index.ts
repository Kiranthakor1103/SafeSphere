import { Router } from 'express';
import authRoutes from './authRoutes';
import disasterRoutes from './disasterRoutes';
import sosRoutes from './sosRoutes';
import shelterRoutes from './shelterRoutes';
import missingPersonRoutes from './missingPersonRoutes';
import teamRoutes from './teamRoutes';
import resourceRoutes from './resourceRoutes';
import alertRoutes from './alertRoutes';
import analyticsRoutes from './analyticsRoutes';
import uploadRoutes from './uploadRoutes';
import iotRoutes from './iotRoutes';
import aiRoutes from './aiRoutes';
import districtRoutes from './districtRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/disasters', disasterRoutes);
router.use('/sos', sosRoutes);
router.use('/shelters', shelterRoutes);
router.use('/missing-persons', missingPersonRoutes);
router.use('/teams', teamRoutes);
router.use('/resources', resourceRoutes);
router.use('/alerts', alertRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/upload', uploadRoutes);
router.use('/iot', iotRoutes);
router.use('/ai', aiRoutes);
router.use('/districts', districtRoutes);

export default router;
