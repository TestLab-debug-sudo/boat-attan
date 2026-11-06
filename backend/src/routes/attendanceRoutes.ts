import { Router } from 'express';
import {
  getTodayLiveAttendance,
  checkIn,
  checkOut,
  approveAttendance,
  bulkApproveAttendance,
  manualCorrectAttendance,
  getMonthlyCalendar
} from '../controllers/attendanceController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/today', getTodayLiveAttendance);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.patch('/:id/approve', authorizeRoles('ADMIN', 'MANAGER'), approveAttendance);
router.post('/approve-all-pending', authorizeRoles('ADMIN', 'MANAGER'), bulkApproveAttendance);
router.get('/monthly-calendar', getMonthlyCalendar);
router.post('/manual-correct', authorizeRoles('ADMIN', 'MANAGER'), manualCorrectAttendance);

export default router;

