import mongoose, { Document, Schema } from 'mongoose';
import { EMPLOYMENT_STATUSES, EmploymentStatus } from '../config/constants.js';

export interface IEmployee extends Document {
  employeeId: string; // e.g. PW-1001
  name: string;
  profilePhoto?: string;
  designation: string;
  department: string;
  mobileNumber: string;
  email: string;
  address?: string;
  dateOfJoining: Date;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  employmentStatus: EmploymentStatus;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: mongoose.Types.ObjectId;
  approvalRemarks?: string;
  shiftTiming?: string;
  basicSalary?: number;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    profilePhoto: { type: String, default: '' },
    designation: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    mobileNumber: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    address: { type: String, default: '' },
    dateOfJoining: { type: Date, required: true, default: Date.now },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    employmentStatus: { type: String, enum: EMPLOYMENT_STATUSES, default: 'ACTIVE', index: true },
    approvalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'APPROVED',
      index: true
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvalRemarks: { type: String, default: '' },
    shiftTiming: { type: String, default: '09:00 AM - 05:30 PM' },
    basicSalary: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Search text index for flexible searching
EmployeeSchema.index({ name: 'text', employeeId: 'text', designation: 'text', department: 'text' });

export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

