import mongoose, { Schema, Document } from 'mongoose';

export interface IUserWarning extends Document {
    userId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'behavior' | 'technical' | 'legal' | 'spam' | 'abuse' | 'other';
    isActive: boolean;
    resolvedAt?: Date;
    resolvedBy?: mongoose.Types.ObjectId;
    resolutionNotes?: string;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    editHistory: {
        editedAt: Date;
        editedBy: mongoose.Types.ObjectId;
        previousData: {
            title: string;
            description: string;
            severity: string;
            category: string;
        };
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserWarningSchema = new Schema<IUserWarning>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    authorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    severity: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'critical'],
    },
    category: {
        type: String,
        required: true,
        enum: ['behavior', 'technical', 'legal', 'spam', 'abuse', 'other'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    resolvedAt: {
        type: Date,
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    resolutionNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    editHistory: [{
        editedAt: {
            type: Date,
            required: true,
        },
        editedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        previousData: {
            title: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            severity: {
                type: String,
                required: true,
            },
            category: {
                type: String,
                required: true,
            },
        },
    }],
}, {
    timestamps: true,
});

// Indexes for optimal query performance
UserWarningSchema.index({ userId: 1, isActive: 1, severity: -1 });
UserWarningSchema.index({ severity: 1, isActive: 1 });
UserWarningSchema.index({ category: 1, isActive: 1 });
UserWarningSchema.index({ createdAt: -1 });
UserWarningSchema.index({ userId: 1, isDeleted: 1 });
UserWarningSchema.index({ authorId: 1, createdAt: -1 });

const UserWarning = mongoose.models.UserWarning || mongoose.model<IUserWarning>('UserWarning', UserWarningSchema);

export default UserWarning;
export { UserWarning };