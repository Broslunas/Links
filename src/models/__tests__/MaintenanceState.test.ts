import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MaintenanceState, { IMaintenanceState } from '../MaintenanceState';

describe('MaintenanceState Model', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        try {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        } catch (error) {
            console.warn('MongoDB Memory Server failed to start, skipping database tests');
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        if (mongoose.connection.readyState === 1) {
            await MaintenanceState.deleteMany({});
        }
    });

    describe('Schema Definition and Validation', () => {
        it('should have all required fields defined in schema', () => {
            const schema = MaintenanceState.schema;

            expect(schema.paths.isActive).toBeDefined();
            expect(schema.paths.activatedBy).toBeDefined();
            expect(schema.paths.activatedAt).toBeDefined();
            expect(schema.paths.message).toBeDefined();
            expect(schema.paths.estimatedDuration).toBeDefined();

            // Check field types
            expect(schema.paths.isActive.instance).toBe('Boolean');
            expect(schema.paths.activatedBy.instance).toBe('String');
            expect(schema.paths.activatedAt.instance).toBe('Date');
            expect(schema.paths.message.instance).toBe('String');
            expect(schema.paths.estimatedDuration.instance).toBe('Number');
        });

        it('should have correct default values', () => {
            const schema = MaintenanceState.schema;
            const isActivePath = schema.paths.isActive as any;

            expect(isActivePath.defaultValue).toBe(false);
        });

        it('should validate email format for activatedBy field', async () => {
            const invalidEmails = [
                'invalid-email',
                'test@',
                '@example.com',
                'test.example.com',
                'test@.com',
                'test@example.',
                ''
            ];

            for (const email of invalidEmails) {
                const state = new MaintenanceState({
                    isActive: true,
                    activatedBy: email,
                    activatedAt: new Date(),
                });

                await expect(state.save()).rejects.toThrow(/Invalid email format/);
            }
        });

        it('should accept valid email formats for activatedBy field', async () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'admin+test@company.org',
                'system@default.com'
            ];

            for (const email of validEmails) {
                await MaintenanceState.deleteMany({});

                const state = new MaintenanceState({
                    isActive: true,
                    activatedBy: email,
                    activatedAt: new Date(),
                });

                const savedState = await state.save();
                expect(savedState.activatedBy).toBe(email);
            }
        });

        it('should validate message length constraint', async () => {
            const longMessage = 'a'.repeat(501); // Exceeds 500 character limit

            const state = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: longMessage,
            });

            await expect(state.save()).rejects.toThrow(/Message cannot exceed 500 characters/);
        });

        it('should accept valid message lengths', async () => {
            const validMessages = [
                'Short message',
                'a'.repeat(500), // Exactly 500 characters
                'a'.repeat(250), // Well within limit
            ];

            for (const message of validMessages) {
                await MaintenanceState.deleteMany({});

                const state = new MaintenanceState({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    activatedAt: new Date(),
                    message,
                });

                const savedState = await state.save();
                expect(savedState.message).toBe(message);
            }
        });

        it('should validate estimatedDuration as positive number', async () => {
            const invalidDurations = [-1, -10, -0.5];

            for (const duration of invalidDurations) {
                const state = new MaintenanceState({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    activatedAt: new Date(),
                    estimatedDuration: duration,
                });

                await expect(state.save()).rejects.toThrow(/Estimated duration must be a positive number/);
            }
        });

        it('should accept valid estimatedDuration values', async () => {
            const validDurations = [0, 30, 60, 120, 1440]; // 0 to 24 hours in minutes

            for (const duration of validDurations) {
                await MaintenanceState.deleteMany({});

                const state = new MaintenanceState({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    activatedAt: new Date(),
                    estimatedDuration: duration,
                });

                const savedState = await state.save();
                expect(savedState.estimatedDuration).toBe(duration);
            }
        });

        it('should allow undefined estimatedDuration', async () => {
            const state = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                // estimatedDuration is undefined
            });

            const savedState = await state.save();
            expect(savedState.estimatedDuration).toBeUndefined();
        });

        it('should trim whitespace from activatedBy and message fields', async () => {
            const state = new MaintenanceState({
                isActive: true,
                activatedBy: '  admin@example.com  ',
                activatedAt: new Date(),
                message: '  System maintenance in progress  ',
            });

            const savedState = await state.save();
            expect(savedState.activatedBy).toBe('admin@example.com');
            expect(savedState.message).toBe('System maintenance in progress');
        });
    });

    describe('Singleton Pattern Implementation', () => {
        it('should prevent creation of multiple MaintenanceState documents', async () => {
            // Create first document
            const state1 = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin1@example.com',
                activatedAt: new Date(),
            });
            await state1.save();

            // Try to create second document
            const state2 = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin2@example.com',
                activatedAt: new Date(),
            });

            await expect(state2.save()).rejects.toThrow(/Only one MaintenanceState document is allowed/);
        });

        it('should allow updating existing singleton document', async () => {
            // Create initial document
            const state = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            const savedState = await state.save();

            // Update the document
            savedState.isActive = true;
            savedState.message = 'Updated maintenance message';
            const updatedState = await savedState.save();

            expect(updatedState.isActive).toBe(true);
            expect(updatedState.message).toBe('Updated maintenance message');

            // Verify only one document exists
            const count = await MaintenanceState.countDocuments();
            expect(count).toBe(1);
        });
    });

    describe('CRUD Operations', () => {
        it('should create a MaintenanceState with required fields only', async () => {
            const stateData = {
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            };

            const state = new MaintenanceState(stateData);
            const savedState = await state.save();

            expect(savedState.isActive).toBe(stateData.isActive);
            expect(savedState.activatedBy).toBe(stateData.activatedBy);
            expect(savedState.activatedAt).toEqual(stateData.activatedAt);
            expect(savedState.createdAt).toBeDefined();
            expect(savedState.updatedAt).toBeDefined();
        });

        it('should create a MaintenanceState with all fields', async () => {
            const stateData = {
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance in progress',
                estimatedDuration: 60,
            };

            const state = new MaintenanceState(stateData);
            const savedState = await state.save();

            expect(savedState.isActive).toBe(stateData.isActive);
            expect(savedState.activatedBy).toBe(stateData.activatedBy);
            expect(savedState.activatedAt).toEqual(stateData.activatedAt);
            expect(savedState.message).toBe(stateData.message);
            expect(savedState.estimatedDuration).toBe(stateData.estimatedDuration);
        });

        it('should read MaintenanceState document', async () => {
            const stateData = {
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'Maintenance completed',
            };

            const state = new MaintenanceState(stateData);
            await state.save();

            const foundState = await MaintenanceState.findOne();
            expect(foundState).toBeTruthy();
            expect(foundState!.isActive).toBe(stateData.isActive);
            expect(foundState!.activatedBy).toBe(stateData.activatedBy);
            expect(foundState!.message).toBe(stateData.message);
        });

        it('should update MaintenanceState document', async () => {
            const state = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            const savedState = await state.save();

            const updateData = {
                isActive: true,
                message: 'Emergency maintenance',
                estimatedDuration: 30,
            };

            const updatedState = await MaintenanceState.findByIdAndUpdate(
                savedState._id,
                updateData,
                { new: true, runValidators: true }
            );

            expect(updatedState!.isActive).toBe(updateData.isActive);
            expect(updatedState!.message).toBe(updateData.message);
            expect(updatedState!.estimatedDuration).toBe(updateData.estimatedDuration);
        });

        it('should delete MaintenanceState document', async () => {
            const state = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            const savedState = await state.save();

            await MaintenanceState.findByIdAndDelete(savedState._id);

            const foundState = await MaintenanceState.findById(savedState._id);
            expect(foundState).toBeNull();
        });

        it('should handle timestamps correctly', async () => {
            const beforeCreate = new Date();

            const state = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            const savedState = await state.save();

            const afterCreate = new Date();

            expect(savedState.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(savedState.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
            expect(savedState.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(savedState.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

            // Test update timestamp
            await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

            savedState.message = 'Updated message';
            const updatedState = await savedState.save();

            expect(updatedState.updatedAt.getTime()).toBeGreaterThan(savedState.createdAt.getTime());
        });
    });

    describe('Static Methods', () => {
        describe('getSingleton', () => {
            it('should create default state when none exists', async () => {
                const state = await MaintenanceState.getSingleton();

                expect(state).toBeTruthy();
                expect(state.isActive).toBe(false);
                expect(state.activatedBy).toBe('system@default.com');
                expect(state.activatedAt).toBeDefined();

                // Verify it was saved to database
                const count = await MaintenanceState.countDocuments();
                expect(count).toBe(1);
            });

            it('should return existing state when one exists', async () => {
                // Create initial state
                const initialState = new MaintenanceState({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    activatedAt: new Date(),
                    message: 'Existing maintenance',
                });
                await initialState.save();

                const retrievedState = await MaintenanceState.getSingleton();

                expect(retrievedState._id.toString()).toBe(initialState._id.toString());
                expect(retrievedState.isActive).toBe(true);
                expect(retrievedState.activatedBy).toBe('admin@example.com');
                expect(retrievedState.message).toBe('Existing maintenance');
            });

            it('should handle race conditions gracefully', async () => {
                // Simulate multiple concurrent calls to getSingleton
                const promises = Array(5).fill(null).map(() => MaintenanceState.getSingleton());
                const results = await Promise.all(promises);

                // All should return the same document
                const firstId = results[0]._id.toString();
                results.forEach(result => {
                    expect(result._id.toString()).toBe(firstId);
                });

                // Only one document should exist
                const count = await MaintenanceState.countDocuments();
                expect(count).toBe(1);
            });
        });

        describe('updateSingleton', () => {
            it('should create new state when none exists (upsert)', async () => {
                const updateData = {
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    message: 'New maintenance mode',
                    estimatedDuration: 45,
                };

                const state = await MaintenanceState.updateSingleton(updateData);

                expect(state.isActive).toBe(updateData.isActive);
                expect(state.activatedBy).toBe(updateData.activatedBy);
                expect(state.message).toBe(updateData.message);
                expect(state.estimatedDuration).toBe(updateData.estimatedDuration);
                expect(state.activatedAt).toBeDefined();

                // Verify it was saved to database
                const count = await MaintenanceState.countDocuments();
                expect(count).toBe(1);
            });

            it('should update existing state', async () => {
                // Create initial state
                const initialState = new MaintenanceState({
                    isActive: false,
                    activatedBy: 'admin1@example.com',
                    activatedAt: new Date(),
                    message: 'Initial message',
                });
                await initialState.save();

                const updateData = {
                    isActive: true,
                    activatedBy: 'admin2@example.com',
                    message: 'Updated maintenance message',
                    estimatedDuration: 90,
                };

                const updatedState = await MaintenanceState.updateSingleton(updateData);

                expect(updatedState._id.toString()).toBe(initialState._id.toString());
                expect(updatedState.isActive).toBe(updateData.isActive);
                expect(updatedState.activatedBy).toBe(updateData.activatedBy);
                expect(updatedState.message).toBe(updateData.message);
                expect(updatedState.estimatedDuration).toBe(updateData.estimatedDuration);

                // Verify only one document exists
                const count = await MaintenanceState.countDocuments();
                expect(count).toBe(1);
            });

            it('should validate update data before saving', async () => {
                const invalidUpdateData = [
                    { message: 'a'.repeat(501) }, // Too long message
                    { estimatedDuration: -1 }, // Negative duration
                    { activatedBy: 'invalid-email' }, // Invalid email
                ];

                for (const updateData of invalidUpdateData) {
                    await expect(MaintenanceState.updateSingleton(updateData))
                        .rejects.toThrow();
                }
            });

            it('should always update activatedAt timestamp', async () => {
                const beforeUpdate = new Date();

                const state = await MaintenanceState.updateSingleton({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                });

                const afterUpdate = new Date();

                expect(state.activatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
                expect(state.activatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
            });

            it('should handle partial updates correctly', async () => {
                // Create initial state
                await MaintenanceState.updateSingleton({
                    isActive: false,
                    activatedBy: 'admin@example.com',
                    message: 'Initial message',
                    estimatedDuration: 60,
                });

                // Partial update - only change isActive
                const updatedState = await MaintenanceState.updateSingleton({
                    isActive: true,
                    activatedBy: 'admin2@example.com',
                });

                expect(updatedState.isActive).toBe(true);
                expect(updatedState.activatedBy).toBe('admin2@example.com');
                // Previous values should be preserved if not specified
                expect(updatedState.message).toBe('Initial message');
                expect(updatedState.estimatedDuration).toBe(60);
            });
        });
    });

    describe('Index Configuration', () => {
        it('should have index on isActive field', () => {
            const indexes = MaintenanceState.schema.indexes();
            const isActiveIndex = indexes.find(index =>
                index[0] && index[0].isActive !== undefined
            );

            expect(isActiveIndex).toBeDefined();
            expect(isActiveIndex![0].isActive).toBe(1);
        });
    });
});