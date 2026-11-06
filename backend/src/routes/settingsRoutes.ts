import { Router } from 'express';
import {
  getCompanySettings,
  updateCompanySettings,
  getAuditLogs
} from '../controllers/settingsController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.get('/', getCompanySettings);
router.put('/', authorizeRoles('ADMIN'), updateCompanySettings);
router.get('/audit-logs', authorizeRoles('ADMIN', 'MANAGER'), getAuditLogs);

export default router;

