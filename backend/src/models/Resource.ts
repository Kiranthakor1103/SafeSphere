import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
  name: string;
  type: 'food' | 'water' | 'medicine' | 'clothing' | 'equipment' | 'vehicle' | 'other';
  quantity: number;
  unit: string;
  status: 'available' | 'allocated' | 'depleted' | 'requested';
  location: { lat: number; lng: number; address: string };
  assignedTo: mongoose.Types.ObjectId;
  disasterId: mongoose.Types.ObjectId;
  providedBy: string;
  expiryDate: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>({
  name: { type: String, required: true },
  type: { type: String, enum: ['food', 'water', 'medicine', 'clothing', 'equipment', 'vehicle', 'other'], required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  status: { type: String, enum: ['available', 'allocated', 'depleted', 'requested'], default: 'available' },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Shelter' },
  disasterId: { type: Schema.Types.ObjectId, ref: 'Disaster' },
  providedBy: { type: String, default: '' },
  expiryDate: { type: Date },
  notes: { type: String, default: '' },
}, { timestamps: true });

ResourceSchema.pre('save', function (this: IResource) {
  if (typeof this.quantity === 'number') {
    if (this.quantity <= 0 && this.status === 'available') {
      this.status = 'depleted';
    } else if (this.quantity > 0 && this.status === 'depleted') {
      this.status = 'available';
    }
  }
});

export default mongoose.model<IResource>('Resource', ResourceSchema);
