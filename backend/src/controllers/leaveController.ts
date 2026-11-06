import { Request, Response } from 'express';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { getTodayKolkataString } from '../utils/dateUtils.js';

export async function applyLeave(req: Request, res: Response): Promise<void> {
  try {
    const { leaveType, startDate, endDate, totalDays, reason } = req.body;
    let employeeId = req.body.employeeId;

    if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      res.status(400).json({ success: false, message: 'All leave fields are required' });
      return;
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const leave = new LeaveApplication({
      employeeId: employee._id,
      employeeCode: employee.employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason,
      approvalStatus: 'PENDING'
    });

    await leave.save();

    // In-app notification for Managers and Admins
    await Notification.create({
      recipientRole: 'ADMIN',
      title: 'New Leave Application',
      message: `${employee.name} (${employee.employeeId}) requested ${totalDays} days of ${leaveType} from ${startDate} to ${endDate}.`,
      type: 'LEAVE_APPLIED',
      link: '/leave-management'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for manager approval',
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAllLeaves(req: Request, res: Response): Promise<void> {
  try {
    const { status, employeeId, leaveType, year, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.approvalStatus = status;
    }

    if (leaveType && leaveType !== 'ALL') {
      filter.leaveType = leaveType;
    }

    if (employeeId && employeeId !== 'ALL') {
      filter.employeeId = employeeId;
    }

    if (year) {
      filter.startDate = { $regex: `^${year}` };
    }

    // If logged in as an EMPLOYEE, only return their leaves
    if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
      filter.employeeId = req.user.employeeId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [leaves, total] = await Promise.all([
      LeaveApplication.find(filter)
        .populate('employeeId', 'name employeeId designation department profilePhoto mobileNumber')
        .populate('approvedBy', 'username role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LeaveApplication.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: leaves,
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

export async function updateLeaveStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'APPROVED' | 'REJECTED' | 'CANCELLED'

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const leave = await LeaveApplication.findById(id).populate('employeeId');
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave application not found' });
      return;
    }

    const emp = leave.employeeId as any;

    leave.approvalStatus = status;
    leave.approvalRemarks = remarks || '';
    leave.approvedBy = req.user?.userId as any;
    leave.approvalDate = new Date();
    await leave.save();

    // When a leave is APPROVED, automatically update attendance calendar records!
    if (status === 'APPROVED') {
      // Generate all dates between startDate and endDate
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        const dateStr = dt.toISOString().split('T')[0];
        // Upsert attendance record with status 'ON_LEAVE'
        await Attendance.findOneAndUpdate(
          { employeeId: emp._id, attendanceDate: dateStr },
          {
            $set: {
              employeeCode: emp.employeeId,
              date: new Date(dateStr),
              status: 'ON_LEAVE',
              remarks: `Approved ${leave.leaveType}: ${leave.reason}`
            }
          },
          { upsert: true, new: true }
        );
      }
    }

    // In-app Notification to the employee
    await Notification.create({
      recipientId: emp.userId || undefined,
      recipientRole: 'EMPLOYEE',
      title: `Leave ${status}`,
      message: `Your ${leave.leaveType} application for ${leave.startDate} to ${leave.endDate} has been ${status.toLowerCase()}.${remarks ? ' Remarks: ' + remarks : ''}`,
      type: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      link: '/leave-management'
    });

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: `LEAVE_${status}`,
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: emp._id,
        targetEmployeeCode: emp.employeeId,
        targetCollection: 'leaveApplications',
        details: { leaveId: leave._id, status, remarks }
      });
    }

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: leave
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

