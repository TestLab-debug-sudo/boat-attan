import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { AuthUserPayload } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'peachwave_super_secret_jwt_key_2026_beach';
const JWT_EXPIRES_IN = '7d';

function createToken(user: IUser, empCode?: string, empId?: string): string {
  const payload: AuthUserPayload = {
    userId: (user._id as any).toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    employeeId: empId,
    employeeCode: empCode
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, password } = req.body; // email or username
    if (!identifier || !password) {
      res.status(400).json({ success: false, message: 'Please provide email/username and password' });
      return;
    }

    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase().trim() }, { username: identifier.trim() }]
    }).populate('employeeId');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Contact HR / Admin.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const emp = user.employeeId as any;
    const token = createToken(user, emp?.employeeId, emp?._id?.toString());

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee: emp ? {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          designation: emp.designation,
          department: emp.department,
          profilePhoto: emp.profilePhoto,
          mobileNumber: emp.mobileNumber
        } : null
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error during login' });
  }
}

/**
 * Fast Demo Login for instant review
 */
export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const role = (req.query.role as string)?.toUpperCase() || 'ADMIN';
    const user = await User.findOne({ role, isActive: true }).populate('employeeId');

    if (!user) {
      res.status(404).json({ success: false, message: `No active demo user found for role: ${role}` });
      return;
    }

    const emp = user.employeeId as any;
    const token = createToken(user, emp?.employeeId, emp?._id?.toString());

    res.json({
      success: true,
      message: `Demo logged in as ${role}`,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee: emp ? {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          designation: emp.designation,
          department: emp.department,
          profilePhoto: emp.profilePhoto,
          mobileNumber: emp.mobileNumber
        } : null
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId).populate('employeeId');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const emp = user.employeeId as any;

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        employee: emp
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Provide current and new password' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password does not match' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

