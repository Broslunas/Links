import mongoose, { Document, Schema } from 'mongoose';

export interface ISharedLink extends Document {
  linkId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  sharedWithUserId: mongoose.Types.ObjectId;
  sharedWithEmail: string;
  permissions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canViewStats: boolean;
    canShare: boolean;
  };
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SharedLinkSchema = new Schema<ISharedLink>(
  {
    linkId: {
      type: Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWithUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedWithEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    permissions: {
      canView: {
        type: Boolean,
        default: true,
      },
      canEdit: {
        type: Boolean,
        default: false,
      },
      canDelete: {
        type: Boolean,
        default: false,
      },
      canViewStats: {
        type: Boolean,
        default: false,
      },
      canShare: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      validate: {
        validator: function(expiresAt: Date) {
          // Si tiene fecha de expiración, debe ser futura
          if (expiresAt && expiresAt <= new Date()) {
            return false;
          }
          return true;
        },
        message: 'Expiration date must be in the future',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimización de rendimiento
SharedLinkSchema.index({ linkId: 1, sharedWithUserId: 1 }, { unique: true });
SharedLinkSchema.index({ sharedWithUserId: 1 });
SharedLinkSchema.index({ ownerId: 1 });
SharedLinkSchema.index({ linkId: 1 });
SharedLinkSchema.index({ isActive: 1 });
SharedLinkSchema.index({ expiresAt: 1 }, { sparse: true });

// Middleware para validar que el owner no se comparta el enlace a sí mismo
SharedLinkSchema.pre('save', function(next) {
  if (this.ownerId.toString() === this.sharedWithUserId.toString()) {
    const error = new Error('Cannot share link with yourself');
    return next(error);
  }
  next();
});

export default mongoose.models.SharedLink ||
  mongoose.model<ISharedLink>('SharedLink', SharedLinkSchema);