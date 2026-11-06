import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserRole, USER_ROLES } from '../config/constants.js';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: Types.ObjectId;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'EMPLOYEE', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

