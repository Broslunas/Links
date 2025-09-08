import mongoose, { Schema, Document } from 'mongoose';

export interface IDeleteRequest extends Document {
    userId: mongoose.Types.ObjectId;
    adminId: mongoose.Types.ObjectId;
    reason: string;
    token: string;
    expiresAt: Date;
    status: 'pending' | 'completed' | 'cancelled';
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeleteRequestSchema = new Schema<IDeleteRequest>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Índices
DeleteRequestSchema.index({ userId: 1, token: 1 });
DeleteRequestSchema.index({ expiresAt: 1 });
DeleteRequestSchema.index({ status: 1 });

const DeleteRequest = mongoose.models.DeleteRequest || mongoose.model<IDeleteRequest>('DeleteRequest', DeleteRequestSchema);

export default DeleteRequest;
export { DeleteRequest };