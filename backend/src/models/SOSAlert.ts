import mongoose, { Document, Schema } from 'mongoose';
import { generateDistrictCode } from '../utils/districtHelper';

export interface ISOSAlert extends Document {
  userId: mongoose.Types.ObjectId;
  disasterId: mongoose.Types.ObjectId;
  type: 'medical' | 'rescue' | 'trapped' | 'fire' | 'flood' | 'food_water' | 'evacuation' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
  country?: string;
  state?: string;
  district?: string;
  districtCode?: string;
  message: string;
  location: { lat: number; lng: number; address: string };
  geo?: { type: string; coordinates: [number, number] };
  assignedTeam: mongoose.Types.ObjectId;
  assignedVolunteers: mongoose.Types.ObjectId[];
  contactPhone: string;
  countryCode: string;
  numberOfPeople: number;
  resolvedAt: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const SOSAlertSchema = new Schema<ISOSAlert>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  type: { type: String, enum: ['medical', 'rescue', 'trapped', 'fire', 'flood', 'food_water', 'evacuation', 'other'], required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'high' },
  status: { type: String, enum: ['pending', 'assigned', 'in_progress', 'resolved', 'cancelled'], default: 'pending' },
  country: { type: String, default: 'India' },
  state: { type: String, default: 'Gujarat' },
  district: { type: String, default: 'Ahmedabad' },
  districtCode: { type: String, default: '', index: true },
  message: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  assignedTeam: { type: Schema.Types.ObjectId, ref: 'RescueTeam' },
  assignedVolunteers: [{ type: Schema.Types.ObjectId, ref: 'Volunteer' }],
  contactPhone: { type: String, default: '' },
  countryCode: { type: String, default: '+91' },
  numberOfPeople: { type: Number, default: 1 },
  resolvedAt: { type: Date },
  notes: { type: String, default: '' },
}, { timestamps: true });

SOSAlertSchema.index({ geo: '2dsphere' });

SOSAlertSchema.pre('save', function (this: ISOSAlert) {
  if (this.location && typeof this.location.lng === 'number' && typeof this.location.lat === 'number') {
    this.geo = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat]
    };
  }
  const dist = this.district || (this.location?.address ? this.location.address.split(',')[0].trim() : '');
  if (dist && !this.districtCode) {
    this.districtCode = generateDistrictCode(this.country || 'India', this.state || 'Gujarat', dist);
  }
});

export default mongoose.model<ISOSAlert>('SOSAlert', SOSAlertSchema);
