export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HALF_DAY'
  | 'WORK_FROM_HOME'
  | 'WEEKLY_OFF'
  | 'HOLIDAY'
  | 'LATE_ARRIVAL';

export type LeaveType =
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Emergency Leave'
  | 'Personal Leave'
  | 'Other';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  employee?: {
    _id: string;
    employeeId: string;
    name: string;
    designation: string;
    department: string;
    profilePhoto?: string;
    mobileNumber: string;
  } | null;
}

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  profilePhoto?: string;
  designation: string;
  department: string;
  mobileNumber: string;
  email: string;
  address?: string;
  dateOfJoining: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'ON_PROBATION' | 'TERMINATED';
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: any;
  approvalRemarks?: string;
  shiftTiming?: string;
  basicSalary?: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: any;
  employeeCode: string;
  attendanceDate: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInTimeFormatted?: string;
  checkOutTimeFormatted?: string;
  workingHours: number;
  status: AttendanceStatus;
  approvalStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isApproved?: boolean;
  approvedByName?: string;
  managerRemarks?: string;
  remarks?: string;
  isManualCorrection?: boolean;
  correctionReason?: string;
}

export interface LeaveApplication {
  _id: string;
  employeeId: any;
  employeeCode: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  approvalStatus: LeaveStatus;
  approvedBy?: any;
  approvalDate?: string;
  approvalRemarks?: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CompanySetting {
  companyName: string;
  companyTagline: string;
  attendanceCutoffTime: string;
  standardCheckInTime: string;
  standardCheckOutTime: string;
  dailyWorkHoursRequired: number;
  halfDayWorkHoursRequired: number;
  workingDaysPerWeek: number;
  timezone: string;
}

export interface AuditLogItem {
  _id: string;
  action: string;
  performedBy: any;
  performerName?: string;
  performerRole?: string;
  targetEmployeeCode?: string;
  targetCollection: string;
  details: Record<string, any>;
  createdAt: string;
}

