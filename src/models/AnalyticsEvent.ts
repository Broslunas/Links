import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEvent extends Document {
    linkId: mongoose.Types.ObjectId;
    timestamp: Date;
    ip: string; // Hashed for privacy
    country: string;
    city: string;
    region: string;
    language: string;
    userAgent: string;
    device: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    referrer?: string;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
    {
        linkId: {
            type: Schema.Types.ObjectId,
            ref: 'Link',
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        ip: {
            type: String,
            required: true,
            // IP will be hashed for privacy
        },
        country: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        region: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        language: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10,
        },
        userAgent: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        device: {
            type: String,
            required: true,
            enum: ['mobile', 'tablet', 'desktop'],
        },
        os: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        browser: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        referrer: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    {
        timestamps: false, // We use our own timestamp field
    }
);

// Create indexes for performance optimization
AnalyticsEventSchema.index({ linkId: 1 });
AnalyticsEventSchema.index({ linkId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ timestamp: -1 });
AnalyticsEventSchema.index({ country: 1 });
AnalyticsEventSchema.index({ device: 1 });
AnalyticsEventSchema.index({ browser: 1 });
AnalyticsEventSchema.index({ os: 1 });

// Compound indexes for common queries
AnalyticsEventSchema.index({ linkId: 1, country: 1 });
AnalyticsEventSchema.index({ linkId: 1, device: 1 });
AnalyticsEventSchema.index({ linkId: 1, timestamp: -1, country: 1 });

// TTL index for data retention (optional - can be configured)
// AnalyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export default mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);