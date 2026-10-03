import { Router } from 'express';
import { getDistrictsList, lookupDistrictCode } from '../controllers/districtController';

const router = Router();

router.get('/', getDistrictsList);
router.get('/lookup', lookupDistrictCode);

export default router;
