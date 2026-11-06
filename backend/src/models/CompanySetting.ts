import mongoose, { Document, Schema } from 'mongoose';

export interface ICompanySetting extends Document {
  companyName: string;
  companyTagline: string;
  logoUrl?: string;
  attendanceCutoffTime: string; // e.g. "10:30"
  standardCheckInTime: string; // e.g. "09:00"
  standardCheckOutTime: string; // e.g. "17:30"
  dailyWorkHoursRequired: number; // e.g. 8.5
  halfDayWorkHoursRequired: number; // e.g. 4.0
  workingDaysPerWeek: number; // e.g. 5 or 6
  timezone: string; // "Asia/Kolkata"
  autoMarkAbsentAfterCutoff: boolean;
  emailNotificationsEnabled: boolean;
  updatedAt: Date;
}

const CompanySettingSchema = new Schema<ICompanySetting>(
  {
    companyName: { type: String, default: 'PEACHWAVE Technologies' },
    companyTagline: { type: String, default: 'Ocean-Inspired Modern Workforce Management' },
    logoUrl: { type: String, default: '' },
    attendanceCutoffTime: { type: String, default: '10:30' },
    standardCheckInTime: { type: String, default: '09:00' },
    standardCheckOutTime: { type: String, default: '17:30' },
    dailyWorkHoursRequired: { type: Number, default: 8.5 },
    halfDayWorkHoursRequired: { type: Number, default: 4.0 },
    workingDaysPerWeek: { type: Number, default: 6 },
    timezone: { type: String, default: 'Asia/Kolkata' },
    autoMarkAbsentAfterCutoff: { type: Boolean, default: true },
    emailNotificationsEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const CompanySetting = mongoose.model<ICompanySetting>('CompanySetting', CompanySettingSchema);

