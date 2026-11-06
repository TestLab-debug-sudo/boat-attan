import ExcelJS from 'exceljs';
import { IAttendance } from '../models/Attendance.js';
import { IEmployee } from '../models/Employee.js';
import { ILeaveApplication } from '../models/LeaveApplication.js';
import { getMonthDates, getTimeKolkataString, getTodayKolkataString } from '../utils/dateUtils.js';

// PEACH BEACH Brand Colors for Excel
const BRAND_COLORS = {
  headerPeach: 'FFBFA3',
  headerDeepOcean: '287D91',
  softPeachBg: 'FFEFE8',
  white: 'FFFFFF',
  navyText: '263746',
  oceanSurface: 'E2F7F9',
  borderGray: 'D0D7DE',
  statusPresent: 'E8F8F0', // Light green
  textPresent: '1B8755',
  statusLeave: 'FFEBEA', // Soft red
  textLeave: 'D32F2F',
  statusPending: 'FFF8E1', // Yellow
  textPending: 'F57F17',
  statusAbsent: 'F1F3F5', // Soft gray
  textAbsent: '5F7589',
  statusWFH: 'E3F2FD', // Soft blue
  textWFH: '1976D2',
  statusHalfDay: 'FFF3E0', // Soft orange
  textHalfDay: 'E65100',
  statusWeekend: 'F5F5F5',
  statusHoliday: 'EDE7F6',
  textHoliday: '512DA8'
};

/**
 * Apply styling to header title banner
 */
function addCompanyReportHeader(
  worksheet: ExcelJS.Worksheet,
  reportTitle: string,
  subTitle: string,
  totalCols: number = 8
) {
  // Title Row
  worksheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = '🌊 PEACHWAVE WORKFORCE MANAGEMENT SYSTEM';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_COLORS.headerDeepOcean }
  };
  worksheet.getRow(1).height = 30;

  // Subtitle / Report name row
  worksheet.mergeCells(2, 1, 2, totalCols);
  const subCell = worksheet.getCell(2, 1);
  subCell.value = `${reportTitle.toUpperCase()}  |  ${subTitle}`;
  subCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF263746' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: BRAND_COLORS.headerPeach }
  };
  worksheet.getRow(2).height = 24;

  // Metadata Row
  worksheet.mergeCells(3, 1, 3, totalCols);
  const metaCell = worksheet.getCell(3, 1);
  metaCell.value = `Exported On: ${getTodayKolkataString()} at ${getTimeKolkataString()} (IST)  •  Official Historical Record`;
  metaCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF5F7589' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  metaCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF9FAFB' }
  };
  worksheet.getRow(3).height = 18;

  // Blank row separator
  worksheet.getRow(4).height = 10;
}

/**
 * 1. Export Daily Attendance Report
 */
export async function generateDailyAttendanceExcel(
  records: Array<{
    employeeId: string;
    employeeName: string;
    designation: string;
    department: string;
    mobileNumber: string;
    status: string;
    checkInTime: string;
    checkOutTime: string;
    workingHours: number;
    remarks: string;
  }>,
  dateStr: string
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PEACHWAVE System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Daily Attendance', {
    views: [{ showGridLines: true }]
  });

  addCompanyReportHeader(sheet, 'Daily Attendance Register', `Date: ${dateStr}`, 10);

  const startRow = 5;
  const headers = [
    'S.No',
    'Employee ID',
    'Employee Name',
    'Designation',
    'Department',
    'Mobile',
    'Status',
    'Check-in',
    'Check-out',
    'Working Hours (Hrs)',
    'Remarks'
  ];

  const headerRow = sheet.getRow(startRow);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLORS.headerDeepOcean }
    };
    cell.border = {
      top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
      bottom: { style: 'medium', color: { argb: BRAND_COLORS.borderGray } },
      left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
      right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
    };
  });
  headerRow.height = 24;

  records.forEach((rec, idx) => {
    const rowNum = startRow + 1 + idx;
    const row = sheet.getRow(rowNum);

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = rec.employeeId;
    row.getCell(3).value = rec.employeeName;
    row.getCell(4).value = rec.designation;
    row.getCell(5).value = rec.department;
    row.getCell(6).value = rec.mobileNumber;
    row.getCell(7).value = rec.status;
    row.getCell(8).value = rec.checkInTime || '-';
    row.getCell(9).value = rec.checkOutTime || '-';
    row.getCell(10).value = rec.workingHours || 0;
    row.getCell(11).value = rec.remarks || '-';

    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

    // Status styling
    const statusCell = row.getCell(7);
    if (rec.status === 'PRESENT') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPresent } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textPresent } };
    } else if (rec.status === 'ABSENT') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusAbsent } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textAbsent } };
    } else if (rec.status === 'ON_LEAVE') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusLeave } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textLeave } };
    } else if (rec.status === 'WORK_FROM_HOME') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusWFH } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textWFH } };
    } else if (rec.status === 'HALF_DAY') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusHalfDay } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textHalfDay } };
    }

    // Light alternating row background
    if (idx % 2 === 1 && !statusCell.fill) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDFBFA' } };
    }

    row.height = 20;
    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
      };
    }
  });

  // Adjust column widths
  sheet.columns = [
    { width: 6 },
    { width: 15 },
    { width: 22 },
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 26 }
  ];

  return workbook;
}

/**
 * 2. Export Monthly Attendance Muster Roll Calendar (.xlsx)
 * Matching the exact monthly calendar requested with 1..31 day columns, color highlights, and totals!
 */
export async function generateMonthlyCalendarExcel(
  employees: any[],
  attendanceMap: Record<string, Record<string, string>>, // empId -> { dateStr: statusCode }
  year: number,
  month: number
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PEACHWAVE System';
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month - 1];

  const sheet = workbook.addWorksheet(`${monthName} ${year} Muster Roll`, {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 3, ySplit: 6 }]
  });

  const monthDays = getMonthDates(year, month);
  const totalDays = monthDays.length;
  const totalCols = 3 + totalDays + 6; // 3 info cols + days + 6 summary cols

  addCompanyReportHeader(sheet, `Monthly Attendance Muster Roll Calendar`, `${monthName} ${year}`, totalCols);

  // Day Name Sub-header (Row 5)
  const dayNameRow = sheet.getRow(5);
  dayNameRow.getCell(1).value = '';
  dayNameRow.getCell(2).value = '';
  dayNameRow.getCell(3).value = 'Day';

  monthDays.forEach((d, idx) => {
    const colIdx = 4 + idx;
    const cell = dayNameRow.getCell(colIdx);
    cell.value = d.dayName.substring(0, 2);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: d.isSunday ? 'FFD32F2F' : 'FF5F7589' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: d.isSunday ? 'FFFFEBEE' : 'FFF9FAFB' }
    };
  });

  // Summary headers in row 5
  const summaryHeaders = ['Total P', 'Total A', 'Total L', 'Total HD', 'Total WFH', 'Att %'];
  summaryHeaders.forEach((sh, idx) => {
    const cell = dayNameRow.getCell(4 + totalDays + idx);
    cell.value = sh;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLORS.headerDeepOcean }
    };
  });
  dayNameRow.height = 18;

  // Main Table Header (Row 6)
  const headerRow = sheet.getRow(6);
  headerRow.getCell(1).value = 'Emp ID';
  headerRow.getCell(2).value = 'Employee Name';
  headerRow.getCell(3).value = 'Designation';

  for (let c = 1; c <= 3; c++) {
    const cell = headerRow.getCell(c);
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF263746' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLORS.headerPeach }
    };
  }

  monthDays.forEach((d, idx) => {
    const colIdx = 4 + idx;
    const cell = headerRow.getCell(colIdx);
    cell.value = d.dayNumber;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: d.isSunday ? 'FFD32F2F' : 'FF263746' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: d.isSunday ? 'FFFFCDD2' : BRAND_COLORS.headerPeach }
    };
  });

  // Summary subheaders in row 6
  summaryHeaders.forEach((sh, idx) => {
    const cell = headerRow.getCell(4 + totalDays + idx);
    cell.value = '';
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: BRAND_COLORS.headerDeepOcean }
    };
  });
  headerRow.height = 22;

  // Populate Employee Attendance Rows
  const startRow = 7;
  employees.forEach((emp, empIdx) => {
    const rowNum = startRow + empIdx;
    const row = sheet.getRow(rowNum);

    row.getCell(1).value = emp.employeeId;
    row.getCell(2).value = emp.name;
    row.getCell(3).value = emp.designation;

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    let countP = 0;
    let countA = 0;
    let countL = 0;
    let countHD = 0;
    let countWFH = 0;
    let totalWorkingDays = 0;

    monthDays.forEach((d, dayIdx) => {
      const colIdx = 4 + dayIdx;
      const cell = row.getCell(colIdx);
      const statusCode = attendanceMap[emp._id.toString()]?.[d.dateString] || (d.isSunday ? 'WO' : 'A');

      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.value = statusCode;

      if (!d.isSunday) {
        totalWorkingDays++;
      }

      // Color coding cell
      if (statusCode === 'P') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPresent } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textPresent }, size: 9 };
        countP++;
      } else if (statusCode === 'L') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusLeave } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textLeave }, size: 9 };
        countL++;
      } else if (statusCode === 'PL') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPending } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textPending }, size: 9 };
      } else if (statusCode === 'WFH') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusWFH } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textWFH }, size: 9 };
        countWFH++;
      } else if (statusCode === 'HD') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusHalfDay } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textHalfDay }, size: 9 };
        countHD++;
      } else if (statusCode === 'WO' || statusCode === 'H') {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusHoliday } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textHoliday }, size: 9 };
      } else {
        // Absent
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusAbsent } };
        cell.font = { bold: true, color: { argb: BRAND_COLORS.textAbsent }, size: 9 };
        if (!d.isSunday) countA++;
      }
    });

    // Summary calculation
    const effectivePresent = countP + countWFH + countHD * 0.5;
    const attPct = totalWorkingDays > 0 ? Math.round((effectivePresent / totalWorkingDays) * 100) : 0;

    const baseCol = 4 + totalDays;
    row.getCell(baseCol).value = countP;
    row.getCell(baseCol + 1).value = countA;
    row.getCell(baseCol + 2).value = countL;
    row.getCell(baseCol + 3).value = countHD;
    row.getCell(baseCol + 4).value = countWFH;
    row.getCell(baseCol + 5).value = `${attPct}%`;

    for (let i = 0; i < 6; i++) {
      const c = row.getCell(baseCol + i);
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.font = { bold: true, size: 10 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F7F9' } };
    }

    row.height = 20;

    // Apply borders
    for (let c = 1; c <= totalCols; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
      };
    }
  });

  // Legend at bottom
  const legendRow = sheet.getRow(startRow + employees.length + 2);
  legendRow.getCell(2).value = 'COLOR LEGEND:';
  legendRow.getCell(2).font = { bold: true };
  const legendItems = [
    { label: 'P: Present', bg: BRAND_COLORS.statusPresent, fg: BRAND_COLORS.textPresent },
    { label: 'L: Approved Leave', bg: BRAND_COLORS.statusLeave, fg: BRAND_COLORS.textLeave },
    { label: 'PL: Pending Leave', bg: BRAND_COLORS.statusPending, fg: BRAND_COLORS.textPending },
    { label: 'A: Absent', bg: BRAND_COLORS.statusAbsent, fg: BRAND_COLORS.textAbsent },
    { label: 'WFH: Work From Home', bg: BRAND_COLORS.statusWFH, fg: BRAND_COLORS.textWFH },
    { label: 'HD: Half Day', bg: BRAND_COLORS.statusHalfDay, fg: BRAND_COLORS.textHalfDay },
    { label: 'WO/H: Off/Holiday', bg: BRAND_COLORS.statusHoliday, fg: BRAND_COLORS.textHoliday }
  ];

  legendItems.forEach((item, idx) => {
    const cell = legendRow.getCell(3 + idx * 2);
    cell.value = item.label;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } };
    cell.font = { bold: true, color: { argb: item.fg }, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Set widths
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 24;
  sheet.getColumn(3).width = 20;
  for (let i = 4; i < 4 + totalDays; i++) {
    sheet.getColumn(i).width = 4.5;
  }
  for (let i = 4 + totalDays; i <= totalCols; i++) {
    sheet.getColumn(i).width = 11;
  }

  return workbook;
}

/**
 * 3. Export Leave Management Report (.xlsx)
 */
export async function generateLeaveReportExcel(leaves: any[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PEACHWAVE System';

  const sheet = workbook.addWorksheet('Leave Applications', { views: [{ showGridLines: true }] });
  addCompanyReportHeader(sheet, 'Leave Management Dossier', 'Official Audit Records', 9);

  const startRow = 5;
  const headers = [
    'S.No',
    'Employee ID',
    'Employee Name',
    'Leave Type',
    'Start Date',
    'End Date',
    'Total Days',
    'Reason',
    'Status',
    'Approval Remarks'
  ];

  const headerRow = sheet.getRow(startRow);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerDeepOcean } };
  });
  headerRow.height = 24;

  leaves.forEach((l, idx) => {
    const rowNum = startRow + 1 + idx;
    const row = sheet.getRow(rowNum);

    row.getCell(1).value = idx + 1;
    row.getCell(2).value = l.employeeCode || l.employeeId?.employeeId;
    row.getCell(3).value = l.employeeId?.name || 'Unknown';
    row.getCell(4).value = l.leaveType;
    row.getCell(5).value = l.startDate;
    row.getCell(6).value = l.endDate;
    row.getCell(7).value = l.totalDays;
    row.getCell(8).value = l.reason;
    row.getCell(9).value = l.approvalStatus;
    row.getCell(10).value = l.approvalRemarks || '-';

    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };

    const statusCell = row.getCell(9);
    if (l.approvalStatus === 'APPROVED') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPresent } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textPresent } };
    } else if (l.approvalStatus === 'REJECTED') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusLeave } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textLeave } };
    } else if (l.approvalStatus === 'PENDING') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPending } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textPending } };
    }

    row.height = 20;
    for (let c = 1; c <= 10; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
      };
    }
  });

  sheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
    { width: 30 },
    { width: 16 },
    { width: 28 }
  ];

  return workbook;
}

/**
 * 4. Export Complete Historical Database or Yearly / Custom Range Workbook
 * Multi-worksheet workbook with:
 * - Attendance Records
 * - Monthly Summary
 * - Employee Master List
 * - Leave Records
 */
export async function generateComprehensiveHistoryExcel(
  title: string,
  subTitle: string,
  attendances: any[],
  employees: any[],
  leaves: any[]
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PEACHWAVE System';

  // --- SHEET 1: ATTENDANCE RECORDS ---
  const sheet1 = workbook.addWorksheet('Historical Attendance', { views: [{ showGridLines: true }] });
  addCompanyReportHeader(sheet1, title, subTitle, 11);

  const startRow = 5;
  const headers = [
    'Date',
    'Emp ID',
    'Employee Name',
    'Designation',
    'Department',
    'Status',
    'Check-in Time',
    'Check-out Time',
    'Working Hours',
    'Correction Audit',
    'Remarks'
  ];

  const headerRow = sheet1.getRow(startRow);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerDeepOcean } };
  });
  headerRow.height = 24;

  attendances.forEach((att, idx) => {
    const rowNum = startRow + 1 + idx;
    const row = sheet1.getRow(rowNum);

    row.getCell(1).value = att.attendanceDate;
    row.getCell(2).value = att.employeeCode || att.employeeId?.employeeId;
    row.getCell(3).value = att.employeeId?.name || 'Unknown';
    row.getCell(4).value = att.employeeId?.designation || '-';
    row.getCell(5).value = att.employeeId?.department || '-';
    row.getCell(6).value = att.status;
    row.getCell(7).value = att.checkInTimeFormatted || '-';
    row.getCell(8).value = att.checkOutTimeFormatted || '-';
    row.getCell(9).value = att.workingHours || 0;
    row.getCell(10).value = att.isManualCorrection ? `Manual: ${att.correctionReason || 'Yes'}` : 'Normal';
    row.getCell(11).value = att.remarks || '-';

    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };

    const statusCell = row.getCell(6);
    if (att.status === 'PRESENT') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusPresent } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textPresent } };
    } else if (att.status === 'ABSENT') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusAbsent } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textAbsent } };
    } else if (att.status === 'ON_LEAVE') {
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.statusLeave } };
      statusCell.font = { bold: true, color: { argb: BRAND_COLORS.textLeave } };
    }

    row.height = 20;
    for (let c = 1; c <= 11; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
      };
    }
  });

  sheet1.columns = [
    { width: 14 },
    { width: 14 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 15 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 20 },
    { width: 24 }
  ];

  // --- SHEET 2: EMPLOYEE MASTER DETAILS ---
  const sheet2 = workbook.addWorksheet('Employee Directory', { views: [{ showGridLines: true }] });
  addCompanyReportHeader(sheet2, 'Employee Master Roster', 'Active & Archived Staff', 8);

  const empHeaders = ['Emp ID', 'Full Name', 'Designation', 'Department', 'Mobile Number', 'Email Address', 'Date of Joining', 'Status'];
  const empHeaderRow = sheet2.getRow(5);
  empHeaders.forEach((h, idx) => {
    const cell = empHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_COLORS.headerPeach } };
  });
  empHeaderRow.height = 24;

  employees.forEach((emp, idx) => {
    const rowNum = 6 + idx;
    const row = sheet2.getRow(rowNum);
    row.getCell(1).value = emp.employeeId;
    row.getCell(2).value = emp.name;
    row.getCell(3).value = emp.designation;
    row.getCell(4).value = emp.department;
    row.getCell(5).value = emp.mobileNumber;
    row.getCell(6).value = emp.email;
    row.getCell(7).value = emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : '-';
    row.getCell(8).value = emp.employmentStatus;

    row.alignment = { vertical: 'middle' };
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };

    row.height = 20;
    for (let c = 1; c <= 8; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        left: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } },
        right: { style: 'thin', color: { argb: BRAND_COLORS.borderGray } }
      };
    }
  });

  sheet2.columns = [
    { width: 14 },
    { width: 22 },
    { width: 20 },
    { width: 18 },
    { width: 18 },
    { width: 28 },
    { width: 16 },
    { width: 14 }
  ];

  return workbook;
}

