import mongoose, { Document, Schema } from 'mongoose';

export interface IShelter extends Document {
  name: string;
  type: 'school' | 'community_center' | 'community_hall' | 'temple' | 'stadium' | 'hotel' | 'camp' | 'hospital' | 'other';
  status: 'open' | 'full' | 'closed' | 'preparing';
  location: { lat: number; lng: number; address: string };
  geo?: { type: string; coordinates: [number, number] };
  capacity: number;
  currentOccupancy: number;
  facilities: {
    foodAvailable: boolean;
    drinkingWater: boolean;
    medicalSupport: boolean;
    electricity: boolean;
    washrooms: boolean;
    wifi: boolean;
    womenArea: boolean;
    childrenArea: boolean;
    wheelchairAccess: boolean;
  };
  contactPerson: string;
  contactPhone: string;
  countryCode: string;
  disasterId: mongoose.Types.ObjectId;
  managedBy: mongoose.Types.ObjectId;
  supplies: { food: boolean; water: boolean; medicine: boolean; bedding: boolean };
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShelterSchema = new Schema<IShelter>({
  name: { type: String, required: true },
  type: { type: String, enum: ['school', 'community_center', 'community_hall', 'temple', 'stadium', 'hotel', 'camp', 'hospital', 'other'], default: 'other' },
  status: { type: String, enum: ['open', 'full', 'closed', 'preparing'], default: 'open' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true }
  },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  facilities: {
    foodAvailable: { type: Boolean, default: false },
    drinkingWater: { type: Boolean, default: false },
    medicalSupport: { type: Boolean, default: false },
    electricity: { type: Boolean, default: false },
    washrooms: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    womenArea: { type: Boolean, default: false },
    childrenArea: { type: Boolean, default: false },
    wheelchairAccess: { type: Boolean, default: false },
  },
  contactPerson: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  countryCode: { type: String, default: '+91' },
  disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  managedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  supplies: {
    food: { type: Boolean, default: false },
    water: { type: Boolean, default: false },
    medicine: { type: Boolean, default: false },
    bedding: { type: Boolean, default: false },
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

ShelterSchema.index({ geo: '2dsphere' });

ShelterSchema.pre('save', function (this: IShelter) {
  if (typeof this.currentOccupancy === 'number' && typeof this.capacity === 'number' && this.capacity > 0) {
    if (this.currentOccupancy >= this.capacity && this.status === 'open') {
      this.status = 'full';
    } else if (this.currentOccupancy < this.capacity && this.status === 'full') {
      this.status = 'open';
    }
  }
  if (this.location && typeof this.location.lng === 'number' && typeof this.location.lat === 'number') {
    this.geo = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat]
    };
  }
});

export default mongoose.model<IShelter>('Shelter', ShelterSchema);
