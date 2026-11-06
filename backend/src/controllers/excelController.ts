import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { getTodayKolkataString, getMonthDates } from '../utils/dateUtils.js';
import {
  generateDailyAttendanceExcel,
  generateMonthlyCalendarExcel,
  generateLeaveReportExcel,
  generateComprehensiveHistoryExcel
} from '../services/excelService.js';

/**
 * 1. Download Daily Attendance Excel
 */
export async function downloadDailyAttendance(req: Request, res: Response): Promise<void> {
  try {
    const dateStr = (req.query.date as string) || getTodayKolkataString();
    const employees = await Employee.find({ employmentStatus: 'ACTIVE' }).sort({ employeeId: 1 });
    const attendances = await Attendance.find({ attendanceDate: dateStr });

    const attMap = new Map();
    attendances.forEach(a => attMap.set(a.employeeId.toString(), a));

    const records = employees.map(emp => {
      const att = attMap.get(emp._id.toString());
      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        mobileNumber: emp.mobileNumber,
        status: att ? att.status : 'ABSENT',
        checkInTime: att?.checkInTimeFormatted || '-',
        checkOutTime: att?.checkOutTimeFormatted || '-',
        workingHours: att?.workingHours || 0,
        remarks: att?.remarks || ''
      };
    });

    const workbook = await generateDailyAttendanceExcel(records, dateStr);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PEACHWAVE_Daily_Attendance_${dateStr}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error downloading daily excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Download Monthly Attendance Calendar Muster Roll Excel
 */
export async function downloadMonthlyAttendance(req: Request, res: Response): Promise<void> {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1);

    const monthDays = getMonthDates(year, month);
    const startDate = monthDays[0].dateString;
    const endDate = monthDays[monthDays.length - 1].dateString;

    const employees = await Employee.find({ employmentStatus: 'ACTIVE' }).sort({ employeeId: 1 });
    const attendances = await Attendance.find({
      attendanceDate: { $gte: startDate, $lte: endDate }
    });
    const leaves = await LeaveApplication.find({
      approvalStatus: 'APPROVED',
      startDate: { $lte: endDate },
      endDate: { $gte: startDate }
    });

    // Map attendances: empId -> dateStr -> code
    const attendanceMap: Record<string, Record<string, string>> = {};
    employees.forEach(e => {
      attendanceMap[e._id.toString()] = {};
    });

    attendances.forEach(att => {
      const eId = att.employeeId.toString();
      if (!attendanceMap[eId]) attendanceMap[eId] = {};
      let code = 'P';
      if (att.status === 'ABSENT') code = 'A';
      else if (att.status === 'ON_LEAVE') code = 'L';
      else if (att.status === 'WORK_FROM_HOME') code = 'WFH';
      else if (att.status === 'HALF_DAY') code = 'HD';
      else if (att.status === 'WEEKLY_OFF') code = 'WO';
      else if (att.status === 'HOLIDAY') code = 'H';
      attendanceMap[eId][att.attendanceDate] = code;
    });

    leaves.forEach(lv => {
      const eId = lv.employeeId.toString();
      monthDays.forEach(d => {
        if (d.dateString >= lv.startDate && d.dateString <= lv.endDate) {
          if (!attendanceMap[eId]) attendanceMap[eId] = {};
          attendanceMap[eId][d.dateString] = 'L';
        }
      });
    });

    const workbook = await generateMonthlyCalendarExcel(employees, attendanceMap, year, month);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PEACHWAVE_Monthly_Calendar_${year}_${String(month).padStart(2, '0')}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Error downloading monthly excel:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 3. Download Yearly Attendance Summary Excel
 */
export async function downloadYearlyAttendance(req: Request, res: Response): Promise<void> {
  try {
    const year = req.query.year || new Date().getFullYear().toString();
    const employees = await Employee.find().sort({ employeeId: 1 });
    const attendances = await Attendance.find({
      attendanceDate: { $regex: `^${year}` }
    }).populate('employeeId');
    const leaves = await LeaveApplication.find({
      startDate: { $regex: `^${year}` }
    }).populate('employeeId');

    const workbook = await generateComprehensiveHistoryExcel(
      `Yearly Attendance Compendium`,
      `Full Year: ${year}`,
      attendances,
      employees,
      leaves
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="PEACHWAVE_Yearly_Summary_${year}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Download Employee-wise Attendance Excel
 */
export async function downloadEmployeeAttendance(req: Request, res: Response): Promise<void> {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const attendances = await Attendance.find({ employeeId: employee._id })
      .populate('employeeId')
      .sort({ attendanceDate: -1 });

    const leaves = await LeaveApplication.find({ employeeId: employee._id })
      .populate('employeeId')
      .sort({ createdAt: -1 });

    const workbook = await generateComprehensiveHistoryExcel(
      `Individual Employee Attendance Dossier`,
      `${employee.name} (${employee.employeeId}) - ${employee.designation}`,
      attendances,
      [employee],
      leaves
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PEACHWAVE_${employee.employeeId}_Attendance_Report.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. Download Leave Management Report Excel
 */
export async function downloadLeaveReport(req: Request, res: Response): Promise<void> {
  try {
    const leaves = await LeaveApplication.find()
      .populate('employeeId')
      .sort({ createdAt: -1 });

    const workbook = await generateLeaveReportExcel(leaves);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="PEACHWAVE_Leave_Management_Report.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 6. Download Complete Historical Attendance Database Excel
 */
export async function downloadCompleteHistory(req: Request, res: Response): Promise<void> {
  try {
    const employees = await Employee.find().sort({ employeeId: 1 });
    const attendances = await Attendance.find().populate('employeeId').sort({ attendanceDate: -1 });
    const leaves = await LeaveApplication.find().populate('employeeId').sort({ createdAt: -1 });

    const workbook = await generateComprehensiveHistoryExcel(
      `Master Historical Attendance Archive`,
      `Permanent Database Records (All Available Years)`,
      attendances,
      employees,
      leaves
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="PEACHWAVE_Complete_Historical_Archive.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 7. Download Custom Date Range Report Excel
 */
export async function downloadCustomDateRange(req: Request, res: Response): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ success: false, message: 'startDate and endDate are required' });
      return;
    }

    const employees = await Employee.find().sort({ employeeId: 1 });
    const attendances = await Attendance.find({
      attendanceDate: { $gte: String(startDate), $lte: String(endDate) }
    }).populate('employeeId').sort({ attendanceDate: 1 });

    const leaves = await LeaveApplication.find({
      startDate: { $lte: String(endDate) },
      endDate: { $gte: String(startDate) }
    }).populate('employeeId');

    const workbook = await generateComprehensiveHistoryExcel(
      `Custom Range Attendance Report`,
      `Range: ${startDate} to ${endDate}`,
      attendances,
      employees,
      leaves
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PEACHWAVE_Report_${startDate}_to_${endDate}.xlsx"`
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

