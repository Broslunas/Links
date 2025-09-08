import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAction extends Document {
    adminId: mongoose.Types.ObjectId;
    targetType: 'user' | 'link';
    targetId: mongoose.Types.ObjectId;
    actionType: 'disable_user' | 'enable_user' | 'disable_link' | 'enable_link' |
    'change_role' | 'add_note' | 'add_warning' | 'resolve_warning' |
    'edit_note' | 'delete_note' | 'edit_warning' | 'delete_warning' |
    'delete_user_request' | 'delete_user' | 'delete_user_completed' | 'cancel_delete_user';
    reason?: string;
    duration?: number; // Duration in days for temporary suspensions
    previousState?: any;
    newState?: any;
    metadata?: {
        warningId?: mongoose.Types.ObjectId;
        noteId?: mongoose.Types.ObjectId;
        previousRole?: string;
        newRole?: string;
        severity?: string;
        category?: string;
    };
    createdAt: Date;
}

const AdminActionSchema = new Schema<IAdminAction>({
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetType: {
        type: String,
        required: true,
        enum: ['user', 'link'],
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    actionType: {
        type: String,
        required: true,
        enum: [
            'disable_user',
            'enable_user',
            'disable_link',
            'enable_link',
            'change_role',
            'add_note',
            'add_warning',
            'resolve_warning',
            'edit_note',
            'delete_note',
            'edit_warning',
            'delete_warning',
            'delete_user_request',
            'delete_user',
            'delete_user_completed',
            'cancel_delete_user'
        ],
    },
    reason: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    duration: {
        type: Number,
        min: 0,
    },
    previousState: {
        type: Schema.Types.Mixed,
    },
    newState: {
        type: Schema.Types.Mixed,
    },
    metadata: {
        warningId: {
            type: Schema.Types.ObjectId,
            ref: 'UserWarning',
        },
        noteId: {
            type: Schema.Types.ObjectId,
            ref: 'UserNote',
        },
        previousRole: {
            type: String,
            enum: ['user', 'admin'],
        },
        newRole: {
            type: String,
            enum: ['user', 'admin'],
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
        },
        category: {
            type: String,
            enum: ['behavior', 'technical', 'legal', 'spam', 'abuse', 'other'],
        },
    },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time for audit trail
});

// Indexes for optimal query performance
AdminActionSchema.index({ adminId: 1, createdAt: -1 });
AdminActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AdminActionSchema.index({ actionType: 1, createdAt: -1 });
AdminActionSchema.index({ createdAt: -1 });
AdminActionSchema.index({ targetId: 1, actionType: 1 });

const AdminAction = mongoose.models.AdminAction || mongoose.model<IAdminAction>('AdminAction', AdminActionSchema);

export default AdminAction;
export { AdminAction };