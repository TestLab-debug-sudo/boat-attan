import { Request, Response } from 'express';
import { CompanySetting } from '../models/CompanySetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { Holiday } from '../models/Holiday.js';
import { Department } from '../models/Department.js';

export async function getCompanySettings(req: Request, res: Response): Promise<void> {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = await CompanySetting.create({
        companyName: 'PEACHWAVE Technologies',
        companyTagline: 'Ocean-Inspired Modern Workforce Management',
        attendanceCutoffTime: '10:30',
        standardCheckInTime: '09:00',
        standardCheckOutTime: '17:30',
        dailyWorkHoursRequired: 8.5,
        halfDayWorkHoursRequired: 4.0,
        workingDaysPerWeek: 6,
        timezone: 'Asia/Kolkata'
      });
    }

    const holidays = await Holiday.find().sort({ date: 1 });
    const departments = await Department.find().sort({ name: 1 });

    res.json({
      success: true,
      data: {
        settings,
        holidays,
        departments
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateCompanySettings(req: Request, res: Response): Promise<void> {
  try {
    let settings = await CompanySetting.findOne();
    if (!settings) {
      settings = new CompanySetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    if (req.user) {
      await AuditLog.create({
        action: 'COMPANY_SETTINGS_UPDATED',
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetCollection: 'companySettings',
        details: req.body
      });
    }

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: settings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('performedBy', 'username role email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments()
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

