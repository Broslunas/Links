import mongoose, { Schema, Document } from 'mongoose';

export interface IUserNote extends Document {
    userId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    content: string;
    category: 'behavior' | 'technical' | 'legal' | 'other';
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    editHistory: {
        editedAt: Date;
        editedBy: mongoose.Types.ObjectId;
        previousContent: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const UserNoteSchema = new Schema<IUserNote>({
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
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    category: {
        type: String,
        required: true,
        enum: ['behavior', 'technical', 'legal', 'other'],
        default: 'other',
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
        previousContent: {
            type: String,
            required: true,
        },
    }],
}, {
    timestamps: true,
});

// Indexes for optimal query performance
UserNoteSchema.index({ userId: 1, createdAt: -1 });
UserNoteSchema.index({ authorId: 1, createdAt: -1 });
UserNoteSchema.index({ category: 1 });
UserNoteSchema.index({ isDeleted: 1 });
UserNoteSchema.index({ userId: 1, isDeleted: 1 });

const UserNote = mongoose.models.UserNote || mongoose.model<IUserNote>('UserNote', UserNoteSchema);

export default UserNote;
export { UserNote };