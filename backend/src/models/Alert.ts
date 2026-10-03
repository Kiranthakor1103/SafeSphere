import mongoose, { Document, Schema } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success' | 'evacuation';
  targetRoles: string[];
  targetCountry?: string;
  targetState?: string;
  targetDistrict?: string;
  sendSMS: boolean;
  disasterId: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  expiresAt: Date;
  area: { lat: number; lng: number; radius: number };
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['warning', 'danger', 'info', 'success', 'evacuation'], default: 'warning' },
  targetRoles: [{ type: String }],
  targetCountry: { type: String, default: 'India' },
  targetState: { type: String, default: 'Gujarat' },
  targetDistrict: { type: String, default: 'All Regions' },
  sendSMS: { type: Boolean, default: false },
  disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  area: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    radius: { type: Number, default: 50 }
  },
}, { timestamps: true });

export default mongoose.model<IAlert>('Alert', AlertSchema);


