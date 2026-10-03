import mongoose, { Document, Schema } from 'mongoose';

export interface IMissingPerson extends Document {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'unknown';
  photo: string;
  description: string;
  lastSeenLocation: { lat: number; lng: number; address: string };
  lastSeenDate: Date;
  status: 'missing' | 'found' | 'deceased';
  reportedBy: mongoose.Types.ObjectId;
  disasterId: mongoose.Types.ObjectId;
  contactPerson: string;
  contactPhone: string;
  countryCode: string;
  distinguishingFeatures: string;
  foundLocation: string;
  foundDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MissingPersonSchema = new Schema<IMissingPerson>({
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other', 'unknown'], default: 'unknown' },
  photo: { type: String, default: '' },
  description: { type: String, default: '' },
  lastSeenLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, required: true }
  },
  lastSeenDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['missing', 'found', 'deceased'], default: 'missing' },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  contactPerson: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  countryCode: { type: String, default: '+91' },
  distinguishingFeatures: { type: String, default: '' },
  foundLocation: { type: String, default: '' },
  foundDate: { type: Date },
}, { timestamps: true });

MissingPersonSchema.pre('save', function (this: IMissingPerson) {
  if ((this.status === 'found' || this.status === 'deceased') && !this.foundDate) {
    this.foundDate = new Date();
  }
  if (this.status === 'found' && !this.foundLocation && this.lastSeenLocation?.address) {
    this.foundLocation = this.lastSeenLocation.address;
  }
});

export default mongoose.model<IMissingPerson>('MissingPerson', MissingPersonSchema);
