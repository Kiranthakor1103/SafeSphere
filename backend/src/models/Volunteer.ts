import mongoose, { Document, Schema } from 'mongoose';

export interface IVolunteer extends Document {
  userId: mongoose.Types.ObjectId;
  skills: string[];
  isAvailable: boolean;
  assignedDisaster: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId;
  location: { lat: number; lng: number; address: string };
  experience: string;
  certifications: string[];
  hoursContributed: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerSchema = new Schema<IVolunteer>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  assignedDisaster: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  assignedTeam: { type: Schema.Types.ObjectId, ref: 'RescueTeam' },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  experience: { type: String, default: '' },
  certifications: [{ type: String }],
  hoursContributed: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IVolunteer>('Volunteer', VolunteerSchema);
