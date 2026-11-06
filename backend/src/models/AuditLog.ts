import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string; // e.g., 'MANUAL_ATTENDANCE_CORRECTION', 'EMPLOYEE_DEACTIVATED', etc.
  performedBy: Types.ObjectId;
  performerName?: string;
  performerRole?: string;
  targetEmployeeId?: Types.ObjectId;
  targetEmployeeCode?: string;
  targetCollection: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    performerName: { type: String, default: '' },
    performerRole: { type: String, default: '' },
    targetEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    targetEmployeeCode: { type: String, default: '' },
    targetCollection: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' }
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

