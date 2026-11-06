import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  approveEmployee,
  updateEmployee,
  toggleEmployeeStatus
} from '../controllers/employeeController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createEmployee);
router.patch('/:id/approve', authorizeRoles('ADMIN'), approveEmployee);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateEmployee);
router.patch('/:id/status', authorizeRoles('ADMIN'), toggleEmployeeStatus);

export default router;

