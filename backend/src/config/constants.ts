export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'ABSENT',
  'ON_LEAVE',
  'HALF_DAY',
  'WORK_FROM_HOME',
  'WEEKLY_OFF',
  'HOLIDAY',
  'LATE_ARRIVAL'
] as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Emergency Leave',
  'Personal Leave',
  'Other'
] as const;

export type LeaveType = typeof LEAVE_TYPES[number];

export const LEAVE_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
] as const;

export type LeaveStatus = typeof LEAVE_STATUSES[number];

export const USER_ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;
export type UserRole = typeof USER_ROLES[number];

export const EMPLOYMENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_PROBATION', 'TERMINATED'] as const;
export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];

export const TIMEZONE = 'Asia/Kolkata';

// Theme Colors
export const THEME = {
  primaryPeach: '#FFBFA3',
  lightPeach: '#FFE0D0',
  warmCream: '#FFF8F2',
  oceanSoftBlue: '#8EDCE6',
  deepOcean: '#287D91',
  coral: '#FF8A75',
  white: '#FFFFFF',
  textDarkNavy: '#263746'
};

// Calendar & Excel Color Codes
export const STATUS_COLORS = {
  PRESENT: { bg: '#E8F8F0', text: '#1B8755', code: 'P', label: 'Present' },
  APPROVED_LEAVE: { bg: '#FFEBEA', text: '#D32F2F', code: 'L', label: 'Approved Leave' },
  PENDING_LEAVE: { bg: '#FFF8E1', text: '#F57F17', code: 'PL', label: 'Pending Leave' },
  ABSENT: { bg: '#F1F3F5', text: '#5F7589', code: 'A', label: 'Absent' },
  WORK_FROM_HOME: { bg: '#E3F2FD', text: '#1976D2', code: 'WFH', label: 'Work From Home' },
  HALF_DAY: { bg: '#FFF3E0', text: '#E65100', code: 'HD', label: 'Half Day' },
  WEEKLY_OFF: { bg: '#F3E5F5', text: '#7B1FA2', code: 'WO', label: 'Weekly Off' },
  HOLIDAY: { bg: '#EDE7F6', text: '#512DA8', code: 'H', label: 'Holiday' },
  LATE_ARRIVAL: { bg: '#FBE9E7', text: '#D84315', code: 'LA', label: 'Late Arrival' }
};

