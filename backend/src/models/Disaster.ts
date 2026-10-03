import mongoose, { Document, Schema } from 'mongoose';
import { generateDistrictCode } from '../utils/districtHelper';

export interface IDisaster extends Document {
  title: string;
  type: 'flood' | 'earthquake' | 'cyclone' | 'fire' | 'landslide' | 'tsunami' | 'drought' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'monitoring' | 'resolved' | 'closed';
  description: string;
  district?: string;
  districtCode?: string;
  state?: string;
  country?: string;
  location: { lat: number; lng: number; address: string; radius: number };
  affectedArea: string;
  affectedCount: number;
  reportedBy: mongoose.Types.ObjectId;
  assignedTeams: mongoose.Types.ObjectId[];
  resources: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DisasterSchema = new Schema<IDisaster>({
  title: { type: String, required: true },
  type: { type: String, enum: ['flood', 'earthquake', 'cyclone', 'fire', 'landslide', 'tsunami', 'drought', 'other'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['active', 'monitoring', 'resolved', 'closed'], default: 'active' },
  description: { type: String, default: '' },
  district: { type: String, default: '' },
  districtCode: { type: String, default: '', index: true },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
    radius: { type: Number, default: 10 }
  },
  affectedArea: { type: String, default: '' },
  affectedCount: { type: Number, default: 0 },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedTeams: [{ type: Schema.Types.ObjectId, ref: 'RescueTeam' }],
  resources: [{ type: Schema.Types.ObjectId, ref: 'Resource' }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  images: [{ type: String }],
}, { timestamps: true });

DisasterSchema.pre('save', function () {
  const dist = this.district || (this.location?.address ? this.location.address.split(',')[0].trim() : '');
  if (dist && !this.districtCode) {
    this.districtCode = generateDistrictCode(this.country || 'India', this.state || 'Gujarat', dist);
  }
});

export default mongoose.model<IDisaster>('Disaster', DisasterSchema);
