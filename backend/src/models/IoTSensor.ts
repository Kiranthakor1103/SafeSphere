import mongoose, { Document, Schema } from 'mongoose';

export interface IIoTSensor extends Document {
  chipId: string;
  name: string;
  sensorType: 'flood_level' | 'location_tracker' | 'debris_distance' | 'air_quality' | 'other';
  status: 'online' | 'offline' | 'warning' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  geo: {
    type: string;
    coordinates: number[];
  };
  distanceMeters: number;
  waterLevelCm: number;
  criticalThresholdCm: number;
  batteryLevel: number;
  lastPing: Date;
  disasterId?: Schema.Types.ObjectId;
  assignedTeam?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IoTSensorSchema = new Schema<IIoTSensor>(
  {
    chipId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    sensorType: {
      type: String,
      enum: ['flood_level', 'location_tracker', 'debris_distance', 'air_quality', 'other'],
      default: 'location_tracker',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'warning', 'critical'],
      default: 'online',
    },
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
      address: { type: String, default: '' },
    },
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    distanceMeters: { type: Number, default: 0 },
    waterLevelCm: { type: Number, default: 0 },
    criticalThresholdCm: { type: Number, default: 300 },
    batteryLevel: { type: Number, default: 100 },
    lastPing: { type: Date, default: Date.now },
    disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
    assignedTeam: { type: Schema.Types.ObjectId, ref: 'RescueTeam' },
  },
  { timestamps: true }
);

IoTSensorSchema.index({ geo: '2dsphere' });

IoTSensorSchema.pre('save', function (this: IIoTSensor) {
  if (this.location && typeof this.location.lng === 'number' && typeof this.location.lat === 'number') {
    this.geo = {
      type: 'Point',
      coordinates: [this.location.lng, this.location.lat],
    };
  }

  // Auto-status based on thresholds & ping age
  if (this.sensorType === 'flood_level' && this.waterLevelCm >= this.criticalThresholdCm) {
    this.status = 'critical';
  } else if (this.sensorType === 'flood_level' && this.waterLevelCm >= this.criticalThresholdCm * 0.8) {
    this.status = 'warning';
  } else {
    this.status = 'online';
  }
});

export default mongoose.model<IIoTSensor>('IoTSensor', IoTSensorSchema);
