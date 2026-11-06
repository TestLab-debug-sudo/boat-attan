import { Router } from 'express';
import {
  downloadDailyAttendance,
  downloadMonthlyAttendance,
  downloadYearlyAttendance,
  downloadEmployeeAttendance,
  downloadLeaveReport,
  downloadCompleteHistory,
  downloadCustomDateRange
} from '../controllers/excelController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

// Note: In typical browser file downloads, token can be passed in Authorization or query parameter
router.get('/daily', downloadDailyAttendance);
router.get('/monthly', downloadMonthlyAttendance);
router.get('/yearly', downloadYearlyAttendance);
router.get('/employee/:employeeId', downloadEmployeeAttendance);
router.get('/leaves', downloadLeaveReport);
router.get('/history', downloadCompleteHistory);
router.get('/custom-range', downloadCustomDateRange);

export default router;

