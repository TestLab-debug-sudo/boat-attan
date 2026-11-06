import mongoose, { Document, Schema, Types } from 'mongoose';
import { ATTENDANCE_STATUSES, AttendanceStatus } from '../config/constants.js';

export interface IAttendance extends Document {
  employeeId: Types.ObjectId;
  employeeCode: string; // denormalized employeeId (e.g. PW-1001) for fast queries
  attendanceDate: string; // YYYY-MM-DD in Asia/Kolkata
  date: Date; // ISO Date for range queries
  checkIn?: Date | null;
  checkOut?: Date | null;
  checkInTimeFormatted?: string; // e.g. "09:15 AM"
  checkOutTimeFormatted?: string; // e.g. "05:30 PM"
  workingHours: number;
  status: AttendanceStatus;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  managerRemarks?: string;
  remarks?: string;
  isManualCorrection: boolean;
  correctedBy?: Types.ObjectId;
  correctionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    employeeCode: { type: String, required: true, uppercase: true, index: true },
    attendanceDate: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    date: { type: Date, required: true, index: true },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    checkInTimeFormatted: { type: String, default: '' },
    checkOutTimeFormatted: { type: String, default: '' },
    workingHours: { type: Number, default: 0 },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true, index: true },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL',
      index: true
    },
    isApproved: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    managerRemarks: { type: String, default: '' },
    remarks: { type: String, default: '' },
    isManualCorrection: { type: Boolean, default: false },
    correctedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    correctionReason: { type: String, default: '' }
  },
  { timestamps: true }
);

// Compound Unique Index: Prevents duplicate attendance entries per employee per day
AttendanceSchema.index({ employeeId: 1, attendanceDate: 1 }, { unique: true });

// Compound indexes for fast historical queries
AttendanceSchema.index({ attendanceDate: 1, status: 1 });
AttendanceSchema.index({ employeeCode: 1, attendanceDate: 1 });
AttendanceSchema.index({ date: 1, status: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

