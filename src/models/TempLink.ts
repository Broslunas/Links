import mongoose, { Document, Schema } from 'mongoose';

export interface ITempLink extends Document {
    originalUrl: string;
    slug: string;
    token: string;
    title?: string;
    description?: string;
    clickCount: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TempLinkSchema = new Schema<ITempLink>(
    {
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
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
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
        clickCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 }, // MongoDB TTL index
        },
    },
    {
        timestamps: true,
    }
);

// Create indexes for performance optimization
TempLinkSchema.index({ slug: 1 }, { unique: true });
TempLinkSchema.index({ token: 1 }, { unique: true });
TempLinkSchema.index({ expiresAt: 1 });
TempLinkSchema.index({ createdAt: -1 });

export default mongoose.models.TempLink ||
    mongoose.model<ITempLink>('TempLink', TempLinkSchema);