import { Router } from 'express';
import { login, demoLogin, getMe, changePassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, changePassword);

export default router;

