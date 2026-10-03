import { Router } from 'express';
import { chatWithAI, triageSOS, recommendShelter } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

// Protect all AI routes
router.use(protect);

router.post('/chat', chatWithAI);
router.post('/triage', triageSOS);
router.post('/triage/:id', triageSOS);
router.post('/recommend-shelter', recommendShelter);

export default router;
