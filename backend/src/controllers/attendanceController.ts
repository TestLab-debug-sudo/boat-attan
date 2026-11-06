import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { Holiday } from '../models/Holiday.js';
import { AuditLog } from '../models/AuditLog.js';
import { CompanySetting } from '../models/CompanySetting.js';
import { Notification } from '../models/Notification.js';
import {
  calculateWorkingHours,
  formatDateKolkata,
  getMonthDates,
  getTimeKolkataString,
  getTodayKolkataString
} from '../utils/dateUtils.js';

/**
 * Get Today's Live Attendance Dashboard
 */
export async function getTodayLiveAttendance(req: Request, res: Response): Promise<void> {
  try {
    const todayStr = (req.query.date as string) || getTodayKolkataString();
    const settings = await CompanySetting.findOne();
    const cutoffTime = settings?.attendanceCutoffTime || '10:30';

    // Fetch all active employees
    const employees = await Employee.find({ employmentStatus: 'ACTIVE' }).sort({ employeeId: 1 });

    // Fetch all attendance for today
    const attendances = await Attendance.find({ attendanceDate: todayStr })
      .populate('employeeId')
      .populate('approvedBy', 'username role');

    const attendanceMap = new Map();
    attendances.forEach(att => {
      const eId = att.employeeId?._id?.toString() || (att.employeeId as any).toString();
      attendanceMap.set(eId, att);
    });

    // Check approved leaves for today
    const approvedLeaves = await LeaveApplication.find({
      approvalStatus: 'APPROVED',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr }
    });

    const leaveMap = new Map();
    approvedLeaves.forEach(lv => {
      leaveMap.set(lv.employeeId.toString(), lv);
    });

    let presentCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;
    let wfhCount = 0;
    let halfDayCount = 0;
    let lateCount = 0;
    let pendingApprovalCount = 0;

    const liveList = employees.map(emp => {
      const att = attendanceMap.get(emp._id.toString());
      const onLeave = leaveMap.get(emp._id.toString());

      let status = 'ABSENT';
      let checkInTime = '-';
      let checkOutTime = '-';
      let workingHours = 0;
      let isApproved = false;
      let approvalStatus = 'NOT_MARKED';
      let approvedByName = '';

      if (att) {
        status = att.status;
        checkInTime = att.checkInTimeFormatted || '-';
        checkOutTime = att.checkOutTimeFormatted || '-';
        workingHours = att.workingHours || 0;
        isApproved = att.isApproved || false;
        approvalStatus = att.approvalStatus || (att.isApproved ? 'APPROVED' : 'PENDING_APPROVAL');
        approvedByName = (att.approvedBy as any)?.username || '';
        if (approvalStatus === 'PENDING_APPROVAL') {
          pendingApprovalCount++;
        }
      } else if (onLeave) {
        status = 'ON_LEAVE';
        isApproved = true;
        approvalStatus = 'APPROVED';
      }

      // Tally
      if (status === 'PRESENT') presentCount++;
      else if (status === 'ON_LEAVE') onLeaveCount++;
      else if (status === 'WORK_FROM_HOME') wfhCount++;
      else if (status === 'HALF_DAY') halfDayCount++;
      else if (status === 'LATE_ARRIVAL') {
        lateCount++;
        presentCount++;
      } else absentCount++;

      return {
        employeeId: emp.employeeId,
        _id: emp._id,
        name: emp.name,
        profilePhoto: emp.profilePhoto,
        designation: emp.designation,
        department: emp.department,
        mobileNumber: emp.mobileNumber,
        status,
        checkInTime,
        checkOutTime,
        workingHours,
        attendanceId: att?._id || null,
        isApproved,
        approvalStatus,
        approvedByName,
        managerRemarks: att?.managerRemarks || '',
        remarks: att?.remarks || ''
      };
    });

    res.json({
      success: true,
      data: {
        date: todayStr,
        cutoffTime,
        summary: {
          totalEmployees: employees.length,
          presentCount,
          absentCount,
          onLeaveCount,
          wfhCount,
          halfDayCount,
          lateCount,
          pendingApprovalCount
        },
        records: liveList
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Check In (Daily Attendance Mark)
 * - Sets approvalStatus = 'PENDING_APPROVAL' (Awaiting Manager verification)
 * - If marked directly by Admin or Manager for themselves, can be auto-approved
 */
export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    const todayStr = getTodayKolkataString();
    const now = new Date();
    const timeFormatted = getTimeKolkataString(now);

    let employeeId = req.body.employeeId;

    if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID is required' });
      return;
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    let attendance = await Attendance.findOne({
      employeeId: employee._id,
      attendanceDate: todayStr
    });

    if (attendance && attendance.checkIn) {
      res.status(400).json({
        success: false,
        message: `Already checked in today at ${attendance.checkInTimeFormatted}`,
        data: attendance
      });
      return;
    }

    // Determine status: Late Arrival check against cutoff
    const settings = await CompanySetting.findOne();
    const cutoffTime = settings?.attendanceCutoffTime || '10:30';
    const [cutoffHours, cutoffMins] = cutoffTime.split(':').map(Number);

    const kolkataParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);

    const curHour = Number(kolkataParts.find(p => p.type === 'hour')?.value || 0);
    const curMin = Number(kolkataParts.find(p => p.type === 'minute')?.value || 0);

    let status = req.body.status || 'PRESENT';
    if (status === 'PRESENT' && (curHour > cutoffHours || (curHour === cutoffHours && curMin > cutoffMins))) {
      status = 'LATE_ARRIVAL';
    }

    // Approval requirement:
    // If marked by employee, approvalStatus = 'PENDING_APPROVAL' (Manager must confirm)
    const isSelfAdmin = req.user?.role === 'ADMIN';
    const approvalStatus = isSelfAdmin ? 'APPROVED' : 'PENDING_APPROVAL';
    const isApproved = isSelfAdmin;

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        attendanceDate: todayStr,
        date: new Date(todayStr),
        checkIn: now,
        checkInTimeFormatted: timeFormatted,
        status,
        approvalStatus,
        isApproved,
        remarks: req.body.remarks || (isSelfAdmin ? 'Admin Punch' : 'Punch submitted by Employee')
      });
    } else {
      attendance.checkIn = now;
      attendance.checkInTimeFormatted = timeFormatted;
      attendance.status = status;
      attendance.approvalStatus = approvalStatus;
      attendance.isApproved = isApproved;
      if (req.body.remarks) attendance.remarks = req.body.remarks;
    }

    await attendance.save();

    // Notify Managers of new attendance submission
    if (!isSelfAdmin) {
      await Notification.create({
        recipientRole: 'MANAGER',
        title: 'Attendance Submission Pending Approval',
        message: `${employee.name} (${employee.employeeId}) marked check-in at ${timeFormatted}. Please verify and approve.`,
        type: 'ATTENDANCE_MARKED',
        link: '/attendance'
      });
    }

    res.json({
      success: true,
      message: isSelfAdmin
        ? `Checked in successfully at ${timeFormatted} (${status})`
        : `Check-in recorded at ${timeFormatted} (${status})! Awaiting Manager approval to confirm.`,
      data: attendance
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Check Out (Daily Attendance Mark)
 */
export async function checkOut(req: Request, res: Response): Promise<void> {
  try {
    const todayStr = getTodayKolkataString();
    const now = new Date();
    const timeFormatted = getTimeKolkataString(now);

    let employeeId = req.body.employeeId;
    if (req.user?.role === 'EMPLOYEE' && req.user.employeeId) {
      employeeId = req.user.employeeId;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID is required' });
      return;
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      attendanceDate: todayStr
    });

    if (!attendance || !attendance.checkIn) {
      res.status(400).json({ success: false, message: 'Cannot check out without a check-in record for today.' });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({
        success: false,
        message: `Already checked out today at ${attendance.checkOutTimeFormatted}`,
        data: attendance
      });
      return;
    }

    attendance.checkOut = now;
    attendance.checkOutTimeFormatted = timeFormatted;
    attendance.workingHours = calculateWorkingHours(attendance.checkIn, now);

    if (attendance.workingHours < 4 && attendance.status === 'PRESENT') {
      attendance.status = 'HALF_DAY';
      attendance.remarks = (attendance.remarks ? attendance.remarks + ' | ' : '') + 'Less than 4 hrs worked';
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Checked out successfully at ${timeFormatted}. Total Hours: ${attendance.workingHours} hrs.`,
      data: attendance
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Manager / Admin Attendance Approval Endpoint
 * Confirms or rejects an employee's daily attendance punch!
 */
export async function approveAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status = 'APPROVED', managerRemarks } = req.body; // status: 'APPROVED' | 'REJECTED'

    const attendance = await Attendance.findById(id).populate('employeeId');
    if (!attendance) {
      res.status(404).json({ success: false, message: 'Attendance record not found' });
      return;
    }

    const emp = attendance.employeeId as any;

    attendance.approvalStatus = status;
    attendance.isApproved = (status === 'APPROVED');
    attendance.approvedBy = req.user?.userId as any;
    attendance.approvalDate = new Date();
    if (managerRemarks !== undefined) attendance.managerRemarks = managerRemarks;

    // If rejected by manager, status becomes ABSENT or requested correction
    if (status === 'REJECTED') {
      attendance.remarks = `Rejected by Manager: ${managerRemarks || 'Invalid punch'}`;
    }

    await attendance.save();

    // In-app Notification to Employee
    await Notification.create({
      recipientId: emp?.userId,
      recipientRole: 'EMPLOYEE',
      title: `Attendance ${status === 'APPROVED' ? 'Confirmed' : 'Rejected'}`,
      message: `Your attendance punch for ${attendance.attendanceDate} has been ${status === 'APPROVED' ? 'confirmed' : 'rejected'} by Manager ${req.user?.username}.${managerRemarks ? ' Note: ' + managerRemarks : ''}`,
      type: 'ATTENDANCE_MARKED',
      link: '/attendance'
    });

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: `ATTENDANCE_${status}`,
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: emp?._id,
        targetEmployeeCode: attendance.employeeCode,
        targetCollection: 'attendance',
        details: {
          attendanceId: attendance._id,
          date: attendance.attendanceDate,
          status,
          managerRemarks
        }
      });
    }

    res.json({
      success: true,
      message: `Attendance for ${emp?.name || attendance.employeeCode} has been ${status.toLowerCase()} and confirmed.`,
      data: attendance
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Bulk Approve Today's Attendance (Manager quick action)
 */
export async function bulkApproveAttendance(req: Request, res: Response): Promise<void> {
  try {
    const dateStr = (req.body.date as string) || getTodayKolkataString();

    const result = await Attendance.updateMany(
      { attendanceDate: dateStr, approvalStatus: 'PENDING_APPROVAL' },
      {
        $set: {
          approvalStatus: 'APPROVED',
          isApproved: true,
          approvedBy: req.user?.userId as any,
          approvalDate: new Date(),
          managerRemarks: 'Bulk approved by Manager'
        }
      }
    );

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: 'ATTENDANCE_BULK_APPROVED',
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetCollection: 'attendance',
        details: { date: dateStr, count: result.modifiedCount }
      });
    }

    res.json({
      success: true,
      message: `Successfully confirmed ${result.modifiedCount} employee attendance punches for ${dateStr}!`,
      modifiedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin Manual Attendance Correction with Audit Trail
 */
export async function manualCorrectAttendance(req: Request, res: Response): Promise<void> {
  try {
    const {
      employeeId,
      attendanceDate,
      status,
      checkInTimeFormatted,
      checkOutTimeFormatted,
      workingHours,
      correctionReason,
      remarks
    } = req.body;

    if (!employeeId || !attendanceDate || !status || !correctionReason) {
      res.status(400).json({
        success: false,
        message: 'employeeId, attendanceDate, status, and correctionReason are required'
      });
      return;
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    let attendance = await Attendance.findOne({ employeeId, attendanceDate });
    const originalRecord = attendance ? attendance.toObject() : null;

    if (!attendance) {
      attendance = new Attendance({
        employeeId: employee._id,
        employeeCode: employee.employeeId,
        attendanceDate,
        date: new Date(attendanceDate),
        status,
        checkInTimeFormatted: checkInTimeFormatted || '09:00 AM',
        checkOutTimeFormatted: checkOutTimeFormatted || '05:30 PM',
        workingHours: workingHours || 8.5,
        remarks: remarks || `Manual entry by admin`,
        isManualCorrection: true,
        isApproved: true,
        approvalStatus: 'APPROVED',
        approvedBy: req.user?.userId as any,
        correctedBy: req.user?.userId as any,
        correctionReason
      });
    } else {
      attendance.status = status;
      if (checkInTimeFormatted !== undefined) attendance.checkInTimeFormatted = checkInTimeFormatted;
      if (checkOutTimeFormatted !== undefined) attendance.checkOutTimeFormatted = checkOutTimeFormatted;
      if (workingHours !== undefined) attendance.workingHours = workingHours;
      if (remarks !== undefined) attendance.remarks = remarks;
      attendance.isManualCorrection = true;
      attendance.isApproved = true;
      attendance.approvalStatus = 'APPROVED';
      attendance.correctedBy = req.user?.userId as any;
      attendance.correctionReason = correctionReason;
    }

    await attendance.save();

    // Audit Log Record
    await AuditLog.create({
      action: 'MANUAL_ATTENDANCE_CORRECTION',
      performedBy: req.user?.userId,
      performerName: req.user?.username,
      performerRole: req.user?.role,
      targetEmployeeId: employee._id,
      targetEmployeeCode: employee.employeeId,
      targetCollection: 'attendance',
      details: {
        date: attendanceDate,
        original: originalRecord,
        corrected: attendance.toObject(),
        reason: correctionReason
      }
    });

    res.json({
      success: true,
      message: 'Attendance corrected and audit log recorded',
      data: attendance
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Advanced Monthly Attendance Calendar Matrix (Muster Roll)
 */
export async function getMonthlyCalendar(req: Request, res: Response): Promise<void> {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1); // 1-12
    const { department, designation, employeeId } = req.query;

    const monthDays = getMonthDates(year, month);
    const startDate = monthDays[0].dateString;
    const endDate = monthDays[monthDays.length - 1].dateString;

    // Filter employees: only show active/approved employees
    const empFilter: any = { employmentStatus: 'ACTIVE' };
    if (department && department !== 'ALL') empFilter.department = department;
    if (designation && designation !== 'ALL') empFilter.designation = designation;
    if (employeeId && employeeId !== 'ALL') empFilter._id = employeeId;

    const employees = await Employee.find(empFilter).sort({ employeeId: 1 });

    // Fetch all attendance for this month
    const attendances = await Attendance.find({
      attendanceDate: { $gte: startDate, $lte: endDate }
    });

    // Fetch approved & pending leaves for this month
    const leaves = await LeaveApplication.find({
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    // Fetch holidays for this year
    const holidays = await Holiday.find({ year });
    const holidayMap = new Map();
    holidays.forEach(h => holidayMap.set(h.date, h.name));

    // Map attendances: empId -> date -> attendance
    const attMap = new Map<string, Map<string, any>>();
    attendances.forEach(att => {
      const eId = att.employeeId.toString();
      if (!attMap.has(eId)) attMap.set(eId, new Map());
      attMap.get(eId)!.set(att.attendanceDate, att);
    });

    // Map leaves: empId -> date -> leave
    const leaveMap = new Map<string, Map<string, any>>();
    leaves.forEach(lv => {
      const eId = lv.employeeId.toString();
      if (!leaveMap.has(eId)) leaveMap.set(eId, new Map());

      // Cover every date in the leave interval
      monthDays.forEach(d => {
        if (d.dateString >= lv.startDate && d.dateString <= lv.endDate) {
          leaveMap.get(eId)!.set(d.dateString, lv);
        }
      });
    });

    // Build the grid matrix
    const matrix = employees.map(emp => {
      const empIdStr = emp._id.toString();
      const empAtts = attMap.get(empIdStr);
      const empLeaves = leaveMap.get(empIdStr);

      let totalP = 0;
      let totalA = 0;
      let totalL = 0;
      let totalPL = 0;
      let totalHD = 0;
      let totalWFH = 0;
      let totalWO = 0;
      let totalH = 0;

      const dailyStatuses: Record<string, { code: string; label: string; isApproved?: boolean; details?: any }> = {};

      monthDays.forEach(day => {
        const dateStr = day.dateString;
        const att = empAtts?.get(dateStr);
        const lv = empLeaves?.get(dateStr);
        const isHol = holidayMap.has(dateStr);

        let code = 'A';
        let label = 'Absent';
        let isApproved = true;

        if (att) {
          isApproved = att.isApproved ?? true;
          if (att.status === 'PRESENT') {
            code = 'P';
            label = isApproved ? 'Present (Confirmed)' : 'Present (Pending Approval)';
            totalP++;
          } else if (att.status === 'LATE_ARRIVAL') {
            code = 'LA';
            label = isApproved ? 'Late Arrival (Confirmed)' : 'Late Arrival (Pending Approval)';
            totalP++;
          } else if (att.status === 'WORK_FROM_HOME') {
            code = 'WFH';
            label = 'Work From Home';
            totalWFH++;
          } else if (att.status === 'HALF_DAY') {
            code = 'HD';
            label = 'Half Day';
            totalHD++;
          } else if (att.status === 'ON_LEAVE') {
            code = 'L';
            label = 'Approved Leave';
            totalL++;
          } else if (att.status === 'WEEKLY_OFF') {
            code = 'WO';
            label = 'Weekly Off';
            totalWO++;
          } else if (att.status === 'HOLIDAY') {
            code = 'H';
            label = 'Holiday';
            totalH++;
          } else {
            code = 'A';
            label = 'Absent';
            totalA++;
          }
        } else if (lv) {
          if (lv.approvalStatus === 'APPROVED') {
            code = 'L';
            label = `Leave (${lv.leaveType})`;
            totalL++;
          } else if (lv.approvalStatus === 'PENDING') {
            code = 'PL';
            label = `Pending Leave (${lv.leaveType})`;
            totalPL++;
          }
        } else if (isHol) {
          code = 'H';
          label = `Holiday: ${holidayMap.get(dateStr)}`;
          totalH++;
        } else if (day.isSunday) {
          code = 'WO';
          label = 'Weekly Off';
          totalWO++;
        } else {
          code = 'A';
          label = 'Absent';
          totalA++;
        }

        dailyStatuses[dateStr] = {
          code,
          label,
          isApproved,
          details: att ? { checkIn: att.checkInTimeFormatted, checkOut: att.checkOutTimeFormatted, hours: att.workingHours, approvalStatus: att.approvalStatus } : null
        };
      });

      const workingDays = monthDays.filter(d => !d.isSunday && !holidayMap.has(d.dateString)).length;
      const effectivePresent = totalP + totalWFH + (totalHD * 0.5);
      const attendancePercentage = workingDays > 0 ? Math.round((effectivePresent / workingDays) * 100) : 0;

      return {
        employee: {
          _id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          profilePhoto: emp.profilePhoto,
          designation: emp.designation,
          department: emp.department
        },
        dailyStatuses,
        totals: {
          totalWorkingDays: workingDays,
          totalP,
          totalA,
          totalL,
          totalPL,
          totalHD,
          totalWFH,
          totalWO,
          totalH,
          attendancePercentage
        }
      };
    });

    res.json({
      success: true,
      data: {
        year,
        month,
        days: monthDays,
        matrix
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
