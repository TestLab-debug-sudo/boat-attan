import { Router } from 'express';
import { queryHistoricalRecords } from '../controllers/historicalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', queryHistoricalRecords);

export default router;

