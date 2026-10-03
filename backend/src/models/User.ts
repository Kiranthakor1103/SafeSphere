import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { generateDistrictCode } from '../utils/districtHelper';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'super_admin' | 'district_admin' | 'shelter_manager' | 'rescue_team' | 'volunteer' | 'citizen' | 'ngo' | 'admin';
  phone: string;
  country: string;
  state: string;
  district: string;
  districtCode: string;
  location: { lat: number; lng: number; address: string };
  isActive: boolean;
  profilePhoto: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['super_admin', 'district_admin', 'shelter_manager', 'rescue_team', 'volunteer', 'citizen', 'ngo', 'admin'], default: 'citizen' },
  phone: { type: String, default: '' },
  country: { type: String, default: 'India' },
  state: { type: String, default: 'Gujarat' },
  district: { type: String, default: 'Ahmedabad' },
  districtCode: { type: String, default: '', index: true },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true },
  profilePhoto: { type: String, default: '' },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (this.district && (!this.districtCode || this.isModified('district') || this.isModified('state'))) {
    this.districtCode = generateDistrictCode(this.country, this.state, this.district);
  }
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
