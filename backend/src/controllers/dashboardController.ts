import { Request, Response } from 'express';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { Department } from '../models/Department.js';
import { getTodayKolkataString } from '../utils/dateUtils.js';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const todayStr = getTodayKolkataString();
    const currentYear = new Date().getFullYear();

    // 1. Top Cards
    const [
      totalEmployees,
      todayAttendances,
      pendingLeavesCount,
      approvedLeavesToday
    ] = await Promise.all([
      Employee.countDocuments({ employmentStatus: 'ACTIVE' }),
      Attendance.find({ attendanceDate: todayStr }).populate('employeeId', 'name employeeId designation department profilePhoto mobileNumber'),
      LeaveApplication.countDocuments({ approvalStatus: 'PENDING' }),
      LeaveApplication.find({
        approvalStatus: 'APPROVED',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr }
      })
    ]);

    let presentToday = 0;
    let absentToday = 0;
    let onLeaveToday = approvedLeavesToday.length;
    let wfhToday = 0;
    let halfDayToday = 0;
    let lateToday = 0;

    todayAttendances.forEach(att => {
      if (att.status === 'PRESENT') presentToday++;
      else if (att.status === 'LATE_ARRIVAL') {
        presentToday++;
        lateToday++;
      } else if (att.status === 'WORK_FROM_HOME') wfhToday++;
      else if (att.status === 'HALF_DAY') halfDayToday++;
      else if (att.status === 'ON_LEAVE') onLeaveToday++;
    });

    // Absent = total active employees minus present, wfh, half-day, on-leave
    const totalAccountedFor = presentToday + wfhToday + halfDayToday + onLeaveToday;
    absentToday = Math.max(0, totalEmployees - totalAccountedFor);

    // 2. Department-wise breakdown
    const departmentBreakdown = await Employee.aggregate([
      { $match: { employmentStatus: 'ACTIVE' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 3. Leave Distribution by Type
    const leaveTypeDistribution = await LeaveApplication.aggregate([
      { $group: { _id: '$leaveType', count: { $sum: 1 } } }
    ]);

    // 4. Monthly Trend (last 6 months)
    const monthlyTrendData = await Attendance.aggregate([
      {
        $group: {
          _id: { $substr: ['$attendanceDate', 0, 7] }, // YYYY-MM
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['PRESENT', 'LATE_ARRIVAL', 'WORK_FROM_HOME']] }, 1, 0]
            }
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0]
            }
          },
          leave: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ON_LEAVE'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. Yearly Comparison (e.g., 2024, 2025, 2026)
    const yearlyComparison = await Attendance.aggregate([
      {
        $group: {
          _id: { $substr: ['$attendanceDate', 0, 4] },
          totalDaysLogged: { $sum: 1 },
          presents: {
            $sum: {
              $cond: [{ $in: ['$status', ['PRESENT', 'LATE_ARRIVAL', 'WORK_FROM_HOME']] }, 1, 0]
            }
          },
          leaves: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ON_LEAVE'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        todayDate: todayStr,
        cards: {
          totalEmployees,
          presentToday,
          absentToday,
          onLeaveToday,
          pendingLeavesCount,
          wfhToday,
          halfDayToday,
          lateToday
        },
        departmentBreakdown: departmentBreakdown.map(d => ({ name: d._id || 'Unassigned', value: d.count })),
        leaveTypeDistribution: leaveTypeDistribution.map(l => ({ name: l._id, count: l.count })),
        monthlyTrend: monthlyTrendData.slice(-6).map(m => ({
          month: m._id,
          present: m.present,
          absent: m.absent,
          leave: m.leave
        })),
        yearlyComparison: yearlyComparison.map(y => ({
          year: y._id,
          total: y.totalDaysLogged,
          present: y.presents,
          leave: y.leaves
        }))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

