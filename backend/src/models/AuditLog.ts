import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  userId: mongoose.Types.ObjectId;
  resource: string;
  resourceId: mongoose.Types.ObjectId;
  details: string;
  ipAddress: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  resource: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId },
  details: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
