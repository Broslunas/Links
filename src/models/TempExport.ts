import mongoose, { Schema, Document } from 'mongoose';

export interface ITempExport extends Document {
  exportId: string;
  userId: string;
  email: string;
  data: any; // JSON data for the export
  createdAt: Date;
  expiresAt: Date;
}

const TempExportSchema = new Schema<ITempExport>({
  exportId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic cleanup
  }
});

// Create TTL index for automatic document expiration
TempExportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TempExport = mongoose.models.TempExport || mongoose.model<ITempExport>('TempExport', TempExportSchema);

export default TempExport;