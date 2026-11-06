import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { Holiday } from '../models/Holiday.js';
import { Department } from '../models/Department.js';
import { Notification } from '../models/Notification.js';
import { CompanySetting } from '../models/CompanySetting.js';
import { AuditLog } from '../models/AuditLog.js';
import { getMonthDates, getTodayKolkataString } from '../utils/dateUtils.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peachwave_db';

const SAMPLE_EMPLOYEES = [
  {
    employeeId: 'PW-1001',
    name: 'Rajesh Sharma',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    designation: 'Senior Supervisor',
    department: 'Operations',
    mobileNumber: '+91-98765-10001',
    email: 'rajesh@peachwave.com',
    address: '14 Coastal Breeze Enclave, Chennai, Tamil Nadu',
    dateOfJoining: new Date('2023-03-15'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 65000,
    emergencyContact: { name: 'Kavita Sharma', relationship: 'Spouse', phone: '+91-98765-90001' }
  },
  {
    employeeId: 'PW-1002',
    name: 'Priya Patel',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    designation: 'Lead Software Engineer',
    department: 'Technology',
    mobileNumber: '+91-98765-10002',
    email: 'priya@peachwave.com',
    address: '88 Cyber Waves Park, Bengaluru, Karnataka',
    dateOfJoining: new Date('2023-06-01'),
    shiftTiming: '09:30 AM - 06:00 PM',
    basicSalary: 95000,
    emergencyContact: { name: 'Manish Patel', relationship: 'Father', phone: '+91-98765-90002' }
  },
  {
    employeeId: 'PW-1003',
    name: 'Arun Kumar',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    designation: 'Senior Plant Operator',
    department: 'Manufacturing',
    mobileNumber: '+91-98765-10003',
    email: 'arun@peachwave.com',
    address: '42 Portside Colony, Kochi, Kerala',
    dateOfJoining: new Date('2023-08-10'),
    shiftTiming: '08:30 AM - 05:00 PM',
    basicSalary: 48000,
    emergencyContact: { name: 'Divya Kumar', relationship: 'Spouse', phone: '+91-98765-90003' }
  },
  {
    employeeId: 'PW-1004',
    name: 'Ananya Iyer',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    designation: 'Quality Assurance Specialist',
    department: 'Quality Control',
    mobileNumber: '+91-98765-10004',
    email: 'ananya@peachwave.com',
    address: '23 Beachfront Heights, Mumbai, Maharashtra',
    dateOfJoining: new Date('2023-10-01'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 55000,
    emergencyContact: { name: 'Gopal Iyer', relationship: 'Father', phone: '+91-98765-90004' }
  },
  {
    employeeId: 'PW-1005',
    name: 'Vikram Singh',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    designation: 'Production Manager',
    department: 'Manufacturing',
    mobileNumber: '+91-98765-10005',
    email: 'vikram@peachwave.com',
    address: '105 Marina Boulevard, Visakhapatnam, Andhra Pradesh',
    dateOfJoining: new Date('2022-11-15'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 85000,
    emergencyContact: { name: 'Ritu Singh', relationship: 'Spouse', phone: '+91-98765-90005' }
  },
  {
    employeeId: 'PW-1006',
    name: 'Sneha Reddy',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    designation: 'HR Specialist',
    department: 'Human Resources',
    mobileNumber: '+91-98765-10006',
    email: 'sneha@peachwave.com',
    address: '77 Coral Reef Way, Hyderabad, Telangana',
    dateOfJoining: new Date('2023-01-20'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 62000,
    emergencyContact: { name: 'Ramesh Reddy', relationship: 'Brother', phone: '+91-98765-90006' }
  },
  {
    employeeId: 'PW-1007',
    name: 'Mohammed Farooq',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    designation: 'Maintenance Technician',
    department: 'Maintenance',
    mobileNumber: '+91-98765-10007',
    email: 'farooq@peachwave.com',
    address: '34 Ocean View Road, Mangaluru, Karnataka',
    dateOfJoining: new Date('2024-02-01'),
    shiftTiming: '08:00 AM - 04:30 PM',
    basicSalary: 42000,
    emergencyContact: { name: 'Amina Farooq', relationship: 'Mother', phone: '+91-98765-90007' }
  },
  {
    employeeId: 'PW-1008',
    name: 'Neha Verma',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    designation: 'UI/UX Designer',
    department: 'Technology',
    mobileNumber: '+91-98765-10008',
    email: 'neha@peachwave.com',
    address: '56 Palm Grove Avenue, Panaji, Goa',
    dateOfJoining: new Date('2024-04-15'),
    shiftTiming: '09:30 AM - 06:00 PM',
    basicSalary: 68000,
    emergencyContact: { name: 'Sunil Verma', relationship: 'Father', phone: '+91-98765-90008' }
  },
  {
    employeeId: 'PW-1009',
    name: 'Suresh Nair',
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    designation: 'Logistics Coordinator',
    department: 'Supply Chain',
    mobileNumber: '+91-98765-10009',
    email: 'suresh@peachwave.com',
    address: '9 Seaside Villa, Alappuzha, Kerala',
    dateOfJoining: new Date('2024-06-01'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 51000,
    emergencyContact: { name: 'Geetha Nair', relationship: 'Spouse', phone: '+91-98765-90009' }
  },
  {
    employeeId: 'PW-1010',
    name: 'Kavita Joshi',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    designation: 'Financial Analyst',
    department: 'Finance',
    mobileNumber: '+91-98765-10010',
    email: 'kavita@peachwave.com',
    address: '12 Harbor View Court, Surat, Gujarat',
    dateOfJoining: new Date('2024-08-15'),
    shiftTiming: '09:00 AM - 05:30 PM',
    basicSalary: 72000,
    emergencyContact: { name: 'Mahesh Joshi', relationship: 'Father', phone: '+91-98765-90010' }
  }
];

const DEPARTMENTS = [
  { name: 'Operations', code: 'OPS', description: 'Plant operations & workflow management' },
  { name: 'Technology', code: 'TECH', description: 'Software engineering, design & infrastructure' },
  { name: 'Manufacturing', code: 'MFG', description: 'Production lines & equipment control' },
  { name: 'Quality Control', code: 'QC', description: 'Product testing & standards verification' },
  { name: 'Human Resources', code: 'HR', description: 'Talent management, employee welfare & payroll' },
  { name: 'Supply Chain', code: 'SCM', description: 'Logistics, inventory & procurement' },
  { name: 'Finance', code: 'FIN', description: 'Accounting, auditing & financial planning' },
  { name: 'Maintenance', code: 'MAINT', description: 'Facility maintenance & hardware upkeep' }
];

const HOLIDAYS = [
  // 2024
  { name: 'Republic Day', date: '2024-01-26', year: 2024, type: 'NATIONAL' },
  { name: 'Holi', date: '2024-03-25', year: 2024, type: 'FESTIVAL' },
  { name: 'Independence Day', date: '2024-08-15', year: 2024, type: 'NATIONAL' },
  { name: 'Gandhi Jayanti', date: '2024-10-02', year: 2024, type: 'NATIONAL' },
  { name: 'Diwali', date: '2024-11-01', year: 2024, type: 'FESTIVAL' },
  // 2025
  { name: 'Republic Day', date: '2025-01-26', year: 2025, type: 'NATIONAL' },
  { name: 'Holi', date: '2025-03-14', year: 2025, type: 'FESTIVAL' },
  { name: 'Independence Day', date: '2025-08-15', year: 2025, type: 'NATIONAL' },
  { name: 'Gandhi Jayanti', date: '2025-10-02', year: 2025, type: 'NATIONAL' },
  { name: 'Diwali', date: '2025-10-20', year: 2025, type: 'FESTIVAL' },
  // 2026
  { name: 'Republic Day', date: '2026-01-26', year: 2026, type: 'NATIONAL' },
  { name: 'Holi', date: '2026-03-04', year: 2026, type: 'FESTIVAL' },
  { name: 'May Day', date: '2026-05-01', year: 2026, type: 'NATIONAL' },
  { name: 'Independence Day', date: '2026-08-15', year: 2026, type: 'NATIONAL' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', year: 2026, type: 'NATIONAL' },
  { name: 'Diwali', date: '2026-11-08', year: 2026, type: 'FESTIVAL' }
];

export async function seedDatabase() {
  try {
    console.log('🌊 Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Attendance.deleteMany({}),
      LeaveApplication.deleteMany({}),
      Holiday.deleteMany({}),
      Department.deleteMany({}),
      Notification.deleteMany({}),
      CompanySetting.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('🏢 Seeding Company Settings, Departments & Holidays...');
    await CompanySetting.create({
      companyName: 'PEACHWAVE Technologies',
      companyTagline: '3D Workforce & Attendance Management System',
      attendanceCutoffTime: '10:30',
      standardCheckInTime: '09:00',
      standardCheckOutTime: '17:30',
      dailyWorkHoursRequired: 8.5,
      halfDayWorkHoursRequired: 4.0,
      workingDaysPerWeek: 6,
      timezone: 'Asia/Kolkata',
      autoMarkAbsentAfterCutoff: true,
      emailNotificationsEnabled: false
    });

    await Department.insertMany(DEPARTMENTS);
    await Holiday.insertMany(HOLIDAYS);

    console.log('👥 Seeding 10 Sample Employees...');
    const createdEmployees: any[] = [];
    for (const empData of SAMPLE_EMPLOYEES) {
      const emp = await Employee.create({
        ...empData,
        approvalStatus: 'APPROVED'
      });
      createdEmployees.push(emp);
    }

    // Add a pending onboarding request submitted by Manager to test Admin Employee Approval:
    console.log('⏳ Adding a sample pending onboarding employee request for Admin approval...');
    const pendingOnboardingEmp = await Employee.create({
      employeeId: 'PW-1011',
      name: 'Dinesh Karthik',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      designation: 'Junior Associate Engineer',
      department: 'Technology',
      mobileNumber: '+91-98765-10011',
      email: 'dinesh@peachwave.com',
      address: '22 Ocean Palms, Chennai',
      dateOfJoining: new Date(),
      shiftTiming: '09:00 AM - 05:30 PM',
      basicSalary: 38000,
      employmentStatus: 'INACTIVE',
      approvalStatus: 'PENDING_APPROVAL',
      approvalRemarks: 'Submitted by Manager Vikram Singh; awaiting Admin confirmation.'
    });

    console.log('🔑 Creating User Accounts for Admin, Manager and Employees...');
    const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
    const managerPasswordHash = await bcrypt.hash('Manager@1234', 10);
    const employeePasswordHash = await bcrypt.hash('Employee@1234', 10);

    // 1. Admin Account
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@peachwave.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true
    });

    // 2. Manager Account (linked to Vikram Singh PW-1005)
    const vikramEmp = createdEmployees.find(e => e.employeeId === 'PW-1005');
    const managerUser = await User.create({
      username: 'manager',
      email: 'manager@peachwave.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      employeeId: vikramEmp._id,
      isActive: true
    });
    vikramEmp.userId = managerUser._id;
    await vikramEmp.save();

    // 3. User accounts for all other employees
    for (const emp of createdEmployees) {
      if (emp.employeeId === 'PW-1005') continue; // already linked to manager

      const empUser = await User.create({
        username: emp.employeeId.toLowerCase(),
        email: emp.email,
        passwordHash: employeePasswordHash,
        role: 'EMPLOYEE',
        employeeId: emp._id,
        isActive: true
      });
      emp.userId = empUser._id;
      await emp.save();
    }

    console.log('📅 Seeding Historical Attendance Records across 2024, 2025, and 2026...');
    const attendanceRecordsToInsert: any[] = [];
    const todayStr = getTodayKolkataString();

    // Generate historical months:
    // 2024: Months 10, 11, 12
    // 2025: Months 1 to 12 (Entire previous year!)
    // 2026: Months 1 to 11 (Current year!)
    const yearMonthList: Array<{ year: number; month: number }> = [
      { year: 2024, month: 10 },
      { year: 2024, month: 11 },
      { year: 2024, month: 12 },
      { year: 2025, month: 1 },
      { year: 2025, month: 2 },
      { year: 2025, month: 3 },
      { year: 2025, month: 4 },
      { year: 2025, month: 5 },
      { year: 2025, month: 6 },
      { year: 2025, month: 7 },
      { year: 2025, month: 8 },
      { year: 2025, month: 9 },
      { year: 2025, month: 10 },
      { year: 2025, month: 11 },
      { year: 2025, month: 12 },
      { year: 2026, month: 1 },
      { year: 2026, month: 2 },
      { year: 2026, month: 3 },
      { year: 2026, month: 4 },
      { year: 2026, month: 5 },
      { year: 2026, month: 6 },
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 }
    ];

    const holidayDates = new Set(HOLIDAYS.map(h => h.date));

    for (const { year, month } of yearMonthList) {
      const days = getMonthDates(year, month);

      for (const d of days) {
        // Stop if future date beyond today
        if (d.dateString > todayStr) continue;

        const isHoliday = holidayDates.has(d.dateString);
        const isSunday = d.isSunday;

        for (const [idx, emp] of createdEmployees.entries()) {
          // If employee joined after this date, skip
          if (new Date(emp.dateOfJoining).toISOString().split('T')[0] > d.dateString) {
            continue;
          }

          let status = 'PRESENT';
          let checkInTimeFormatted = '09:00 AM';
          let checkOutTimeFormatted = '05:30 PM';
          let workingHours = 8.5;
          let remarks = 'Regular shift completed';

          if (isHoliday) {
            status = 'HOLIDAY';
            checkInTimeFormatted = '';
            checkOutTimeFormatted = '';
            workingHours = 0;
            remarks = 'Official Holiday';
          } else if (isSunday) {
            status = 'WEEKLY_OFF';
            checkInTimeFormatted = '';
            checkOutTimeFormatted = '';
            workingHours = 0;
            remarks = 'Weekly Off';
          } else {
            // Realistic pseudo-random distribution based on date hash & employee index
            const pseudoRand = (d.dayNumber * 7 + idx * 13 + month * 19 + year) % 100;

            if (pseudoRand < 3) {
              status = 'ABSENT';
              checkInTimeFormatted = '';
              checkOutTimeFormatted = '';
              workingHours = 0;
              remarks = 'Uninformed Absence';
            } else if (pseudoRand < 7) {
              status = 'ON_LEAVE';
              checkInTimeFormatted = '';
              checkOutTimeFormatted = '';
              workingHours = 0;
              remarks = 'Approved Casual Leave';
            } else if (pseudoRand < 11) {
              status = 'WORK_FROM_HOME';
              checkInTimeFormatted = '09:15 AM';
              checkOutTimeFormatted = '05:45 PM';
              workingHours = 8.5;
              remarks = 'WFH Approved';
            } else if (pseudoRand < 14) {
              status = 'HALF_DAY';
              checkInTimeFormatted = '09:00 AM';
              checkOutTimeFormatted = '01:00 PM';
              workingHours = 4.0;
              remarks = 'Half day morning shift';
            } else if (pseudoRand < 18) {
              status = 'LATE_ARRIVAL';
              checkInTimeFormatted = '10:45 AM';
              checkOutTimeFormatted = '06:30 PM';
              workingHours = 7.75;
              remarks = 'Late arrival due to traffic';
            } else {
              // Standard Present
              const minOffset = (pseudoRand % 15);
              const padMin = String(minOffset).padStart(2, '0');
              checkInTimeFormatted = `09:${padMin} AM`;
              checkOutTimeFormatted = `05:3${pseudoRand % 9} PM`;
              workingHours = 8.5;
            }
          }

          // Build check-in/out Date objects if present
          let checkInDate: Date | null = null;
          let checkOutDate: Date | null = null;

          if (checkInTimeFormatted) {
            checkInDate = new Date(`${d.dateString}T09:00:00.000Z`);
            checkOutDate = new Date(`${d.dateString}T17:30:00.000Z`);
          }

          // If date is today, create realistic pending punches awaiting Manager approval
          const isTodayDate = (d.dateString === todayStr);
          let isApproved = true;
          let approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' = 'APPROVED';

          if (isTodayDate && (idx === 0 || idx === 1 || idx === 2)) {
            // Rajesh, Priya, Arun marked attendance today -> Pending Manager verification!
            isApproved = false;
            approvalStatus = 'PENDING_APPROVAL';
            status = (idx === 1) ? 'LATE_ARRIVAL' : 'PRESENT';
            checkInTimeFormatted = (idx === 1) ? '10:45 AM' : '09:05 AM';
            remarks = 'Punch marked by employee via portal; pending manager confirmation';
          }

          attendanceRecordsToInsert.push({
            employeeId: emp._id,
            employeeCode: emp.employeeId,
            attendanceDate: d.dateString,
            date: new Date(d.dateString),
            checkIn: checkInDate,
            checkOut: checkOutDate,
            checkInTimeFormatted,
            checkOutTimeFormatted,
            workingHours,
            status,
            approvalStatus,
            isApproved,
            remarks
          });
        }
      }
    }

    // Insert attendances in batches for high speed
    console.log(`Inserting ${attendanceRecordsToInsert.length} historical attendance documents...`);
    const chunkSize = 1000;
    for (let i = 0; i < attendanceRecordsToInsert.length; i += chunkSize) {
      const chunk = attendanceRecordsToInsert.slice(i, i + chunkSize);
      await Attendance.insertMany(chunk, { ordered: false }).catch(() => {});
    }

    console.log('📝 Seeding Sample Leave Applications...');
    const sampleLeaves = [
      {
        employeeId: createdEmployees[0]._id, // Rajesh
        employeeCode: 'PW-1001',
        leaveType: 'Casual Leave',
        startDate: '2026-11-12',
        endDate: '2026-11-14',
        totalDays: 3,
        reason: 'Family wedding ceremony in hometown',
        approvalStatus: 'PENDING'
      },
      {
        employeeId: createdEmployees[1]._id, // Priya
        employeeCode: 'PW-1002',
        leaveType: 'Sick Leave',
        startDate: '2026-11-02',
        endDate: '2026-11-03',
        totalDays: 2,
        reason: 'Viral fever and prescribed medical rest',
        approvalStatus: 'APPROVED',
        approvedBy: adminUser._id,
        approvalDate: new Date('2026-11-01'),
        approvalRemarks: 'Approved. Get well soon!'
      },
      {
        employeeId: createdEmployees[2]._id, // Arun
        employeeCode: 'PW-1003',
        leaveType: 'Personal Leave',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        totalDays: 2,
        reason: 'Personal banking and property registration',
        approvalStatus: 'PENDING'
      },
      {
        employeeId: createdEmployees[3]._id, // Ananya
        employeeCode: 'PW-1004',
        leaveType: 'Emergency Leave',
        startDate: '2026-10-15',
        endDate: '2026-10-16',
        totalDays: 2,
        reason: 'Medical emergency in immediate family',
        approvalStatus: 'APPROVED',
        approvedBy: managerUser._id,
        approvalDate: new Date('2026-10-14'),
        approvalRemarks: 'Approved under emergency quota'
      },
      {
        employeeId: createdEmployees[4]._id, // Vikram
        employeeCode: 'PW-1005',
        leaveType: 'Casual Leave',
        startDate: '2025-12-24',
        endDate: '2025-12-26',
        totalDays: 3,
        reason: 'Year-end vacation with family',
        approvalStatus: 'APPROVED',
        approvedBy: adminUser._id,
        approvalDate: new Date('2025-12-15'),
        approvalRemarks: 'Approved'
      },
      {
        employeeId: createdEmployees[5]._id, // Sneha
        employeeCode: 'PW-1006',
        leaveType: 'Casual Leave',
        startDate: '2025-08-11',
        endDate: '2025-08-12',
        totalDays: 2,
        reason: 'Travel out of station',
        approvalStatus: 'REJECTED',
        approvedBy: adminUser._id,
        approvalDate: new Date('2025-08-09'),
        approvalRemarks: 'Quarterly review audit in progress during these dates.'
      }
    ];

    await LeaveApplication.insertMany(sampleLeaves);

    console.log('🔔 Seeding Sample In-app Notifications...');
    await Notification.insertMany([
      {
        recipientRole: 'ADMIN',
        title: 'New Leave Request Received',
        message: 'Rajesh Sharma has applied for 3 days Casual Leave from 12-Nov to 14-Nov.',
        type: 'LEAVE_APPLIED',
        link: '/leave-management',
        isRead: false
      },
      {
        recipientRole: 'EMPLOYEE',
        recipientId: createdEmployees[1].userId,
        title: 'Leave Approved',
        message: 'Your Sick Leave for 02-Nov to 03-Nov was approved by Admin.',
        type: 'LEAVE_APPROVED',
        link: '/leave-management',
        isRead: true
      },
      {
        recipientRole: 'ALL',
        title: 'Welcome to PEACHWAVE 3D System',
        message: 'Production-ready Employee Attendance & Workforce Management live!',
        type: 'SYSTEM',
        link: '/dashboard',
        isRead: false
      }
    ]);

    console.log('📜 Seeding Sample Audit Logs...');
    await AuditLog.create({
      action: 'INITIAL_SYSTEM_SETUP',
      performedBy: adminUser._id,
      performerName: 'admin',
      performerRole: 'ADMIN',
      targetCollection: 'system',
      details: {
        message: 'PEACHWAVE database successfully initialized with 10 employees & historical records'
      }
    });

    console.log('✨ SEEDING COMPLETE! ✨');
    console.log('--------------------------------------------------');
    console.log('DEMO ACCOUNTS:');
    console.log('1. Admin:    admin@peachwave.com    / Admin@1234');
    console.log('2. Manager:  manager@peachwave.com  / Manager@1234');
    console.log('3. Employee: rajesh@peachwave.com   / Employee@1234');
    console.log('--------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
