import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenanceState extends Document {
    isActive: boolean;
    activatedBy: string;
    activatedAt: Date;
    message?: string;
    estimatedDuration?: number; // in minutes
    createdAt: Date;
    updatedAt: Date;
}

const MaintenanceStateSchema = new Schema<IMaintenanceState>({
    isActive: {
        type: Boolean,
        required: true,
        default: false,
    },
    activatedBy: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (email: string) {
                // Basic email validation
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Invalid email format for activatedBy field',
        },
    },
    activatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    message: {
        type: String,
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    estimatedDuration: {
        type: Number,
        min: [0, 'Estimated duration must be a positive number'],
        validate: {
            validator: function (duration: number) {
                // Allow undefined/null or positive numbers
                return duration === undefined || duration === null || duration >= 0;
            },
            message: 'Estimated duration must be a positive number or undefined',
        },
    },
}, {
    timestamps: true,
});

// Create index for efficient queries on isActive field
MaintenanceStateSchema.index({ isActive: 1 });

// Singleton pattern implementation - ensure only one document exists
MaintenanceStateSchema.pre('save', async function () {
    // Check if this is a new document and if there are any existing documents
    if (this.isNew) {
        const existingCount = await mongoose.model('MaintenanceState').countDocuments();
        if (existingCount > 0) {
            throw new Error('Only one MaintenanceState document is allowed (singleton pattern)');
        }
    }
});

// Static method to get or create the singleton instance
MaintenanceStateSchema.statics.getSingleton = async function (): Promise<IMaintenanceState> {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount <= maxRetries) {
        try {
            let state = await this.findOne().maxTimeMS(5000); // 5 second timeout

            if (!state) {
                console.log('No maintenance state found, creating default state', {
                    timestamp: new Date().toISOString(),
                    retryCount
                });

                // Create default state if none exists
                state = new this({
                    isActive: false,
                    activatedBy: 'system@default.com', // Default system email
                    activatedAt: new Date(),
                });

                try {
                    await state.save();
                    console.log('Default maintenance state created successfully', {
                        timestamp: new Date().toISOString()
                    });
                } catch (saveError) {
                    // Handle potential race condition where another process created the state
                    if (saveError instanceof Error && saveError.message.includes('singleton')) {
                        console.log('Singleton state was created by another process, fetching it', {
                            timestamp: new Date().toISOString()
                        });
                        state = await this.findOne().maxTimeMS(5000);
                        if (!state) {
                            throw new Error('Failed to retrieve maintenance state after creation conflict');
                        }
                    } else {
                        throw saveError;
                    }
                }
            }

            return state;
        } catch (error) {
            retryCount++;

            console.error(`Error getting maintenance singleton (attempt ${retryCount}/${maxRetries + 1}):`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString(),
                retryCount
            });

            if (retryCount > maxRetries) {
                console.error('Failed to get maintenance state after all retries', {
                    totalAttempts: maxRetries + 1,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Failed to retrieve maintenance state: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Unexpected error in getSingleton method');
};

// Static method to update the singleton state (upsert pattern)
MaintenanceStateSchema.statics.updateSingleton = async function (
    updateData: Partial<IMaintenanceState>
): Promise<IMaintenanceState> {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    // Validate update data before attempting update
    if (updateData.message && typeof updateData.message === 'string' && updateData.message.length > 500) {
        throw new Error('Message cannot exceed 500 characters');
    }

    if (updateData.estimatedDuration !== undefined &&
        (typeof updateData.estimatedDuration !== 'number' || updateData.estimatedDuration < 0)) {
        throw new Error('Estimated duration must be a positive number');
    }

    if (updateData.activatedBy && typeof updateData.activatedBy === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.activatedBy)) {
            throw new Error('Invalid email format for activatedBy field');
        }
    }

    while (retryCount <= maxRetries) {
        try {
            console.log('Attempting to update maintenance state', {
                updateData: { ...updateData, activatedBy: updateData.activatedBy ? '[REDACTED]' : undefined },
                timestamp: new Date().toISOString(),
                retryCount
            });

            // Use findOneAndUpdate with upsert to ensure singleton pattern
            const state = await this.findOneAndUpdate(
                {}, // Empty filter to match any document (should be only one)
                {
                    ...updateData,
                    activatedAt: new Date(), // Always update the activation timestamp
                },
                {
                    new: true, // Return the updated document
                    upsert: true, // Create if doesn't exist
                    runValidators: true, // Run schema validators
                    maxTimeMS: 10000, // 10 second timeout
                }
            );

            if (!state) {
                throw new Error('Update operation returned null state');
            }

            console.log('Maintenance state updated successfully', {
                isActive: state.isActive,
                hasMessage: !!state.message,
                hasEstimatedDuration: !!state.estimatedDuration,
                timestamp: new Date().toISOString()
            });

            return state;
        } catch (error) {
            retryCount++;

            console.error(`Error updating maintenance singleton (attempt ${retryCount}/${maxRetries + 1}):`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                updateData: { ...updateData, activatedBy: updateData.activatedBy ? '[REDACTED]' : undefined },
                timestamp: new Date().toISOString(),
                retryCount
            });

            // Handle specific error types
            if (error instanceof Error) {
                if (error.message.includes('validation')) {
                    // Don't retry validation errors
                    throw error;
                }
                if (error.message.includes('duplicate') || error.message.includes('E11000')) {
                    // Handle duplicate key errors (shouldn't happen with upsert, but just in case)
                    console.warn('Duplicate key error during upsert, this should not happen', {
                        timestamp: new Date().toISOString()
                    });
                }
            }

            if (retryCount > maxRetries) {
                console.error('Failed to update maintenance state after all retries', {
                    totalAttempts: maxRetries + 1,
                    finalError: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Failed to update maintenance state: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, retryCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Unexpected error in updateSingleton method');
};

// Add interface for static methods
interface IMaintenanceStateModel extends mongoose.Model<IMaintenanceState> {
    getSingleton(): Promise<IMaintenanceState>;
    updateSingleton(updateData: Partial<IMaintenanceState>): Promise<IMaintenanceState>;
}

const MaintenanceState = (mongoose.models.MaintenanceState ||
    mongoose.model<IMaintenanceState, IMaintenanceStateModel>('MaintenanceState', MaintenanceStateSchema)) as IMaintenanceStateModel;

export default MaintenanceState;
export { MaintenanceState };