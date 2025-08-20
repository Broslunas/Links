import mongoose, { Document, Schema } from 'mongoose';

export interface IDomain extends Document {
  userId: mongoose.Types.ObjectId;
  domain: string;
  isVerified: boolean;
  isActive: boolean;
  cnameTarget: string;
  verificationToken: string;
  lastVerificationAttempt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (domain: string) {
          // Basic domain validation regex
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
          return domainRegex.test(domain);
        },
        message: 'Invalid domain format',
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    cnameTarget: {
      type: String,
      required: true,
      default: 'custom.broslunas.link',
    },
    verificationToken: {
      type: String,
      required: true,
    },
    lastVerificationAttempt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
DomainSchema.index({ userId: 1 });
DomainSchema.index({ domain: 1 }, { unique: true });
DomainSchema.index({ isVerified: 1 });
DomainSchema.index({ isActive: 1 });
DomainSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Domain ||
  mongoose.model<IDomain>('Domain', DomainSchema);