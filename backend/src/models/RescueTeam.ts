import mongoose, { Document, Schema } from 'mongoose';

export interface IRescueTeam extends Document {
  name: string;
  specialization: string[];
  status: 'available' | 'deployed' | 'standby' | 'off_duty';
  members: mongoose.Types.ObjectId[];
  leader: mongoose.Types.ObjectId;
  location: { lat: number; lng: number; address: string };
  geo?: { type: string; coordinates: [number, number] };
  assignedDisaster: mongoose.Types.ObjectId;
  assignedSOS: mongoose.Types.ObjectId[];
  equipment: string[];
  contactPhone: string;
  countryCode: string;
  vehicleType: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const VEHICLE_ENUM = [
  'AirCraft', 'Helicopter', 'Boat', 'Truck', 'Car', 'Ambulance', 'Heavy Rig', 'SUV', 'Other',
  'AMB', 'CAR', 'TRK', 'HELI', 'ambulance', 'car', 'truck', 'boat', 'helicopter', 'aircraft', 'suv'
];

const vehicleAliasMap: Record<string, string> = {
  AMB: 'Ambulance',
  ambulance: 'Ambulance',
  CAR: 'Car',
  car: 'Car',
  TRK: 'Truck',
  truck: 'Truck',
  HELI: 'Helicopter',
  helicopter: 'Helicopter',
  boat: 'Boat',
  aircraft: 'AirCraft',
  suv: 'SUV',
};

const RescueTeamSchema = new Schema<IRescueTeam>({
  name: { type: String, required: true, unique: true },
  specialization: [{ type: String }],
  status: { type: String, enum: ['available', 'deployed', 'standby', 'off_duty'], default: 'available' },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  leader: { type: Schema.Types.ObjectId, ref: 'User' },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  assignedDisaster: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  assignedSOS: [{ type: Schema.Types.ObjectId, ref: 'SOSAlert' }],
  equipment: [{ type: String }],
  contactPhone: { type: String, default: '' },
  countryCode: { type: String, default: '+91' },
  vehicleType: { type: String, enum: VEHICLE_ENUM, default: 'Car' },
  capacity: { type: Number, default: 10 },
}, { timestamps: true });

RescueTeamSchema.index({ geo: '2dsphere' });

RescueTeamSchema.pre('save', function (this: IRescueTeam) {
  if (this.vehicleType && vehicleAliasMap[this.vehicleType]) {
    this.vehicleType = vehicleAliasMap[this.vehicleType];
  }
  if (this.location && typeof this.location.lng === 'number' && typeof this.location.lat === 'number') {
    this.geo = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat]
    };
  }
});

export default mongoose.model<IRescueTeam>('RescueTeam', RescueTeamSchema);
