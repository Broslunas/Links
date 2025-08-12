import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    name: string;
    image?: string;
    provider: 'github' | 'google';
    providerId: string;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
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
        enum: ['github', 'google'],
    },
    providerId: {
        type: String,
        required: true,
        unique: true,
    },
}, {
    timestamps: true,
});

// Create compound index for provider and providerId
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Create index for email
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
export { User };