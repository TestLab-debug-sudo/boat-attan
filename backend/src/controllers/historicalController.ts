import { Request, Response } from 'express';
import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { Holiday } from '../models/Holiday.js';

export async function queryHistoricalRecords(req: Request, res: Response): Promise<void> {
  try {
    const {
      year,
      month,
      startDate,
      endDate,
      employeeId,
      department,
      designation,
      status,
      search,
      page = 1,
      limit = 100
    } = req.query;

    // 1. Build date query
    const dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery.attendanceDate = { $gte: String(startDate), $lte: String(endDate) };
    } else if (year && month) {
      const padMonth = String(month).padStart(2, '0');
      dateQuery.attendanceDate = { $regex: `^${year}-${padMonth}` };
    } else if (year) {
      dateQuery.attendanceDate = { $regex: `^${year}` };
    }

    if (status && status !== 'ALL') {
      dateQuery.status = status;
    }

    // 2. Build employee filter
    const empFilter: any = {};
    if (department && department !== 'ALL') {
      empFilter.department = department;
    }
    if (designation && designation !== 'ALL') {
      empFilter.designation = designation;
    }
    if (employeeId && employeeId !== 'ALL') {
      empFilter._id = employeeId;
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      empFilter.$or = [
        { name: regex },
        { employeeId: regex },
        { mobileNumber: regex },
        { designation: regex },
        { department: regex }
      ];
    }

    // Find matched employee IDs
    const matchedEmployees = await Employee.find(empFilter).select('_id employeeId name designation department mobileNumber');
    const matchedEmpIds = matchedEmployees.map(e => e._id);

    dateQuery.employeeId = { $in: matchedEmpIds };

    const skip = (Number(page) - 1) * Number(limit);

    // Run parallel queries: Paginated Attendance records, Summary metrics, Leave records
    const [records, totalRecords, allMatchedAttendances] = await Promise.all([
      Attendance.find(dateQuery)
        .populate('employeeId', 'name employeeId designation department mobileNumber')
        .sort({ attendanceDate: -1, employeeCode: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(dateQuery),
      Attendance.find(dateQuery).select('status workingHours attendanceDate employeeId')
    ]);

    // Aggregate metrics
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalWFH = 0;
    let totalHalfDay = 0;
    let totalLate = 0;
    let totalHours = 0;

    allMatchedAttendances.forEach(att => {
      totalHours += att.workingHours || 0;
      if (att.status === 'PRESENT') totalPresent++;
      else if (att.status === 'ABSENT') totalAbsent++;
      else if (att.status === 'ON_LEAVE') totalLeave++;
      else if (att.status === 'WORK_FROM_HOME') totalWFH++;
      else if (att.status === 'HALF_DAY') totalHalfDay++;
      else if (att.status === 'LATE_ARRIVAL') {
        totalLate++;
        totalPresent++;
      }
    });

    const effectivePresent = totalPresent + totalWFH + (totalHalfDay * 0.5);
    const nonRestDays = totalPresent + totalAbsent + totalLeave + totalWFH + totalHalfDay;
    const attendancePercentage = nonRestDays > 0 ? Math.round((effectivePresent / nonRestDays) * 100) : 0;

    // Available distinct years in DB for dropdown
    const distinctDates = await Attendance.aggregate([
      {
        $group: {
          _id: { $substr: ['$attendanceDate', 0, 4] }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const availableYears = distinctDates.map(d => d._id).filter(Boolean);
    if (!availableYears.includes('2026')) availableYears.unshift('2026');
    if (!availableYears.includes('2025')) availableYears.push('2025');
    if (!availableYears.includes('2024')) availableYears.push('2024');

    res.json({
      success: true,
      data: {
        records,
        summary: {
          totalRecords,
          totalPresent,
          totalAbsent,
          totalLeave,
          totalWFH,
          totalHalfDay,
          totalLate,
          totalHours: Math.round(totalHours * 10) / 10,
          attendancePercentage
        },
        availableYears: Array.from(new Set(availableYears)),
        pagination: {
          total: totalRecords,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(totalRecords / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

