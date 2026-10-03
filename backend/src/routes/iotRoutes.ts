import { Router } from 'express';
import {
  receiveTelemetry,
  getSensors,
  createSensor,
  updateSensor,
  deleteSensor,
} from '../controllers/iotController';
import { protect, authorize } from '../middleware/auth';
import { authenticateIoTDevice } from '../middleware/iotDeviceAuth';

const router = Router();

// Hardware telemetry uses a device API key, not an end-user session token.
router.post('/telemetry', authenticateIoTDevice, receiveTelemetry);

// Protected admin endpoints for viewing and configuring IoT sensors
router.get('/sensors', protect, getSensors);
router.post('/sensors', protect, authorize('super_admin', 'district_admin'), createSensor);
router.put('/sensors/:id', protect, authorize('super_admin', 'district_admin'), updateSensor);
router.delete('/sensors/:id', protect, authorize('super_admin', 'district_admin'), deleteSensor);

export default router;
