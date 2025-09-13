import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  provider: 'github' | 'google' | 'discord' | 'twitch';
  providerId: string;
  role: 'user' | 'admin';
  isActive?: boolean;
  // Admin password for additional security
  adminPassword?: string;
  adminPasswordCreatedAt?: Date;
  // Discord-specific fields
  discordUsername?: string;
  discordDiscriminator?: string;
  discordGlobalName?: string;
  discordVerified?: boolean;
  discordLocale?: string;
  // Additional provider data
  providerData?: {
    username?: string;
    discriminator?: string;
    global_name?: string;
    verified?: boolean;
    locale?: string;
    avatar?: string;
    banner?: string;
    accent_color?: number;
    premium_type?: number;
    public_flags?: number;
  };
  // API token for public API access
  apiToken?: string;
  apiTokenCreatedAt?: Date;
  apiTokenLastUsedAt?: Date;
  // User preferences
  defaultPublicStats?: boolean;
  emailNotifications?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['github', 'google', 'discord'],
    },
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    // Discord-specific fields
    discordUsername: {
      type: String,
      trim: true,
    },
    discordDiscriminator: {
      type: String,
      trim: true,
    },
    discordGlobalName: {
      type: String,
      trim: true,
    },
    discordVerified: {
      type: Boolean,
    },
    discordLocale: {
      type: String,
      trim: true,
    },
    // Additional provider data (flexible object for future extensions)
    providerData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Admin password for additional security
    adminPassword: {
      type: String,
      trim: true,
    },
    adminPasswordCreatedAt: {
      type: Date,
    },
    // API token for public API access
    apiToken: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      trim: true,
    },
    apiTokenCreatedAt: {
      type: Date,
    },
    apiTokenLastUsedAt: {
      type: Date,
    },
    // User preferences
    defaultPublicStats: {
      type: Boolean,
      default: false,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for provider and providerId
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Create index for email
UserSchema.index({ email: 1 }, { unique: true });

let User: mongoose.Model<IUser>;
if (mongoose?.models?.User) {
  User = mongoose.models.User;
} else if (mongoose?.model) {
  User = mongoose.model<IUser>('User', UserSchema);
} else {
  throw new Error('Mongoose is not initialized properly.');
}

export default User;
export { User };
