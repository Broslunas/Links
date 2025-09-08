import mongoose, { Document, Schema } from 'mongoose';

export interface ILink extends Document {
  userId: mongoose.Types.ObjectId;
  originalUrl: string;
  slug: string;
  title?: string;
  description?: string;
  isPublicStats: boolean;
  isActive: boolean;
  isDisabledByAdmin: boolean;
  disabledReason?: string;
  isFavorite: boolean;
  clickCount: number;
  isTemporary: boolean;
  expiresAt?: Date;
  isExpired: boolean;
  customDomain?: mongoose.Types.ObjectId; // Referencia al dominio personalizado
  createdAt: Date;
  updatedAt: Date;
}

const LinkSchema = new Schema<ILink>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (url: string) {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: 'Invalid URL format',
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 1,
      maxlength: 50,
      match: /^[a-z0-9-_]+$/,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isPublicStats: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDisabledByAdmin: {
      type: Boolean,
      default: false,
    },
    disabledReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isTemporary: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
      validate: {
        validator: function(this: ILink, expiresAt: Date) {
          // Si es temporal, debe tener fecha de expiración
          if (this.isTemporary && !expiresAt) {
            return false;
          }
          // Si no es temporal, no debe tener fecha de expiración
          if (!this.isTemporary && expiresAt) {
            return false;
          }
          // Si tiene fecha de expiración, debe ser futura
          if (expiresAt && expiresAt <= new Date()) {
            return false;
          }
          return true;
        },
        message: 'Invalid expiration date for temporary link',
      },
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    customDomain: {
      type: Schema.Types.ObjectId,
      ref: 'CustomDomain',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance optimization
// LinkSchema.index({ slug: 1 }, { unique: true });
LinkSchema.index({ userId: 1 });
LinkSchema.index({ userId: 1, createdAt: -1 });
LinkSchema.index({ isActive: 1 });
LinkSchema.index({ isPublicStats: 1 });
LinkSchema.index({ isTemporary: 1, expiresAt: 1 });
LinkSchema.index({ expiresAt: 1 }, { sparse: true });
LinkSchema.index({ customDomain: 1 }, { sparse: true });
LinkSchema.index({ userId: 1, customDomain: 1 });

export default mongoose.models.Link ||
  mongoose.model<ILink>('Link', LinkSchema);
