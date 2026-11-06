import mongoose, { Document, Schema, Types } from 'mongoose';
import { LEAVE_STATUSES, LEAVE_TYPES, LeaveStatus, LeaveType } from '../config/constants.js';

export interface ILeaveApplication extends Document {
  employeeId: Types.ObjectId;
  employeeCode: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  approvalStatus: LeaveStatus;
  approvedBy?: Types.ObjectId;
  approvalDate?: Date;
  approvalRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveApplicationSchema = new Schema<ILeaveApplication>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    employeeCode: { type: String, required: true, uppercase: true, index: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String, required: true, index: true },
    totalDays: { type: Number, required: true, min: 0.5 },
    reason: { type: String, required: true, trim: true },
    approvalStatus: { type: String, enum: LEAVE_STATUSES, default: 'PENDING', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvalDate: { type: Date },
    approvalRemarks: { type: String, default: '' }
  },
  { timestamps: true }
);

LeaveApplicationSchema.index({ employeeId: 1, approvalStatus: 1 });
LeaveApplicationSchema.index({ startDate: 1, endDate: 1 });

export const LeaveApplication = mongoose.model<ILeaveApplication>('LeaveApplication', LeaveApplicationSchema);

