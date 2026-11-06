import { Router } from 'express';
import { applyLeave, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllLeaves);
router.post('/apply', applyLeave);
router.patch('/:id/status', authorizeRoles('ADMIN', 'MANAGER'), updateLeaveStatus);

export default router;

