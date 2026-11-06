import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  recipientId?: Types.ObjectId; // null for broadcast to all managers/admins
  recipientRole?: 'ALL' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  title: string;
  message: string;
  type: 'LEAVE_APPLIED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'ATTENDANCE_MARKED' | 'ATTENDANCE_MISSING' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    recipientRole: { type: String, enum: ['ALL', 'ADMIN', 'MANAGER', 'EMPLOYEE'], default: 'ALL' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['LEAVE_APPLIED', 'LEAVE_APPROVED', 'LEAVE_REJECTED', 'ATTENDANCE_MARKED', 'ATTENDANCE_MISSING', 'SYSTEM'],
      required: true
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

