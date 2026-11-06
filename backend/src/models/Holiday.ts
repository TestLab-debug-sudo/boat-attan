import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: string; // YYYY-MM-DD
  year: number;
  type: 'NATIONAL' | 'FESTIVAL' | 'COMPANY';
  description?: string;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true, unique: true, index: true }, // YYYY-MM-DD
    year: { type: Number, required: true, index: true },
    type: { type: String, enum: ['NATIONAL', 'FESTIVAL', 'COMPANY'], default: 'NATIONAL' },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Holiday = mongoose.model<IHoliday>('Holiday', HolidaySchema);

