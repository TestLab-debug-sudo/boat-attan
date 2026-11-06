import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee, IEmployee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { LeaveApplication } from '../models/LeaveApplication.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

export async function getAllEmployees(req: Request, res: Response): Promise<void> {
  try {
    const { search, department, designation, status, approvalStatus, page = 1, limit = 50 } = req.query;

    const query: any = {};

    if (status && status !== 'ALL') {
      query.employmentStatus = status;
    }

    if (approvalStatus && approvalStatus !== 'ALL') {
      query.approvalStatus = approvalStatus;
    }

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (designation && designation !== 'ALL') {
      query.designation = designation;
    }

    if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      query.$or = [
        { name: regex },
        { employeeId: regex },
        { mobileNumber: regex },
        { email: regex },
        { designation: regex },
        { department: regex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [employees, total, pendingApprovalsCount] = await Promise.all([
      Employee.find(query).sort({ createdAt: -1, employeeId: 1 }).skip(skip).limit(Number(limit)),
      Employee.countDocuments(query),
      Employee.countDocuments({ approvalStatus: 'PENDING_APPROVAL' })
    ]);

    res.json({
      success: true,
      data: employees,
      pendingApprovalsCount,
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

export async function getEmployeeById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Fetch recent 30 attendance records and all leaves
    const [recentAttendance, leaveHistory, totalPresent, totalAbsent, totalLeaves] = await Promise.all([
      Attendance.find({ employeeId: employee._id }).sort({ attendanceDate: -1 }).limit(30),
      LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 }),
      Attendance.countDocuments({ employeeId: employee._id, status: 'PRESENT' }),
      Attendance.countDocuments({ employeeId: employee._id, status: 'ABSENT' }),
      LeaveApplication.countDocuments({ employeeId: employee._id, approvalStatus: 'APPROVED' })
    ]);

    res.json({
      success: true,
      data: {
        employee,
        stats: {
          totalPresent,
          totalAbsent,
          totalLeaves
        },
        recentAttendance,
        leaveHistory
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Create Employee
 * - If Admin creates: Immediately APPROVED & ACTIVE
 * - If Manager creates: PENDING_APPROVAL by Admin (Admin must confirm)
 */
export async function createEmployee(req: Request, res: Response): Promise<void> {
  try {
    const {
      employeeId,
      name,
      profilePhoto,
      designation,
      department,
      mobileNumber,
      email,
      address,
      dateOfJoining,
      emergencyContact,
      shiftTiming = '09:00 AM - 05:30 PM',
      basicSalary = 0
    } = req.body;

    if (!employeeId || !name || !designation || !department || !mobileNumber || !email) {
      res.status(400).json({ success: false, message: 'Missing required employee fields' });
      return;
    }

    const existingEmp = await Employee.findOne({
      $or: [{ employeeId: employeeId.toUpperCase().trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existingEmp) {
      res.status(400).json({ success: false, message: 'Employee ID or Email already exists' });
      return;
    }

    // Approval status workflow:
    // If Admin: Auto-approved and Active.
    // If Manager: PENDING_APPROVAL and Inactive until Admin confirms.
    const isAdmin = req.user?.role === 'ADMIN';
    const approvalStatus = isAdmin ? 'APPROVED' : 'PENDING_APPROVAL';
    const employmentStatus = isAdmin ? 'ACTIVE' : 'INACTIVE';

    const newEmployee = new Employee({
      employeeId: employeeId.toUpperCase().trim(),
      name: name.trim(),
      profilePhoto: profilePhoto || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      designation: designation.trim(),
      department: department.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.toLowerCase().trim(),
      address: address || '',
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : new Date(),
      emergencyContact: emergencyContact || {},
      employmentStatus,
      approvalStatus,
      approvedBy: isAdmin ? (req.user?.userId as any) : undefined,
      approvalRemarks: isAdmin ? 'Created directly by Admin' : 'Submitted by Manager; Pending Admin Confirmation',
      shiftTiming,
      basicSalary
    });

    await newEmployee.save();

    // Automatically create a User account for this employee with default password 'Employee@1234'
    const passwordHash = await bcrypt.hash('Employee@1234', 10);
    const newUser = new User({
      username: newEmployee.employeeId.toLowerCase(),
      email: newEmployee.email,
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: newEmployee._id,
      isActive: isAdmin // only active if admin created
    });
    await newUser.save();

    newEmployee.userId = newUser._id as any;
    await newEmployee.save();

    // If submitted by Manager, notify Admin!
    if (!isAdmin) {
      await Notification.create({
        recipientRole: 'ADMIN',
        title: 'New Employee Onboarding Approval Request',
        message: `Manager ${req.user?.username} submitted onboarding for ${newEmployee.name} (${newEmployee.employeeId}). Admin confirmation required.`,
        type: 'SYSTEM',
        link: '/employees'
      });
    }

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: isAdmin ? 'EMPLOYEE_CREATED' : 'EMPLOYEE_ONBOARDING_REQUESTED',
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: newEmployee._id,
        targetEmployeeCode: newEmployee.employeeId,
        targetCollection: 'employees',
        details: {
          name: newEmployee.name,
          designation: newEmployee.designation,
          approvalStatus,
          employmentStatus
        }
      });
    }

    res.status(201).json({
      success: true,
      message: isAdmin
        ? 'Employee created successfully with active portal credentials'
        : 'New employee onboarding request submitted successfully! Awaiting Admin confirmation to activate.',
      data: newEmployee
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Admin Employee Approval Endpoint (Confirm or Reject new employee onboarding)
 */
export async function approveEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // status: 'APPROVED' | 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
      return;
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    employee.approvalStatus = status;
    employee.approvedBy = req.user?.userId as any;
    employee.approvalRemarks = remarks || (status === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin');
    employee.employmentStatus = status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE';
    await employee.save();

    // Activate user portal account if approved
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, {
        isActive: status === 'APPROVED'
      });
    }

    // Notify Managers
    await Notification.create({
      recipientRole: 'MANAGER',
      title: `Employee Onboarding ${status}`,
      message: `Admin ${req.user?.username} ${status.toLowerCase()} employee ${employee.name} (${employee.employeeId}). ${remarks ? 'Note: ' + remarks : ''}`,
      type: 'SYSTEM',
      link: '/employees'
    });

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: `EMPLOYEE_${status}`,
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: employee._id,
        targetEmployeeCode: employee.employeeId,
        targetCollection: 'employees',
        details: { status, remarks }
      });
    }

    res.json({
      success: true,
      message: `Employee ${employee.name} onboarding has been ${status.toLowerCase()} by Admin.`,
      data: employee
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const previousData = { ...employee.toObject() };
    Object.assign(employee, req.body);
    await employee.save();

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: 'EMPLOYEE_UPDATED',
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: employee._id,
        targetEmployeeCode: employee.employeeId,
        targetCollection: 'employees',
        details: { previous: previousData, updated: req.body }
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function toggleEmployeeStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACTIVE' or 'INACTIVE'

    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    employee.employmentStatus = status;
    await employee.save();

    // Sync user active state
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: status === 'ACTIVE' });
    }

    // Audit Log
    if (req.user) {
      await AuditLog.create({
        action: status === 'ACTIVE' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
        performedBy: req.user.userId,
        performerName: req.user.username,
        performerRole: req.user.role,
        targetEmployeeId: employee._id,
        targetEmployeeCode: employee.employeeId,
        targetCollection: 'employees',
        details: { newStatus: status }
      });
    }

    res.json({
      success: true,
      message: `Employee status set to ${status}`,
      data: employee
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
