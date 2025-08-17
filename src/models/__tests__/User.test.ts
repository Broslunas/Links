import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User, { IUser } from '../User';

describe('User Model', () => {
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
            await User.deleteMany({});
        }
    });

    describe('Schema Definition', () => {
        it('should have API token fields defined in schema', () => {
            const schema = User.schema;

            expect(schema.paths.apiToken).toBeDefined();
            expect(schema.paths.apiTokenCreatedAt).toBeDefined();
            expect(schema.paths.apiTokenLastUsedAt).toBeDefined();

            // Check field types
            expect(schema.paths.apiToken.instance).toBe('String');
            expect(schema.paths.apiTokenCreatedAt.instance).toBe('Date');
            expect(schema.paths.apiTokenLastUsedAt.instance).toBe('Date');
        });

        it('should have correct schema options for apiToken', () => {
            const apiTokenPath = User.schema.paths.apiToken as any;

            expect(apiTokenPath.options.unique).toBe(true);
            expect(apiTokenPath.options.sparse).toBe(true);
            expect(apiTokenPath.options.trim).toBe(true);
        });
    });

    describe('API Token Fields', () => {
        it('should create a user without API token fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const,
                providerId: 'github123',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.name).toBe(userData.name);
            expect(savedUser.provider).toBe(userData.provider);
            expect(savedUser.providerId).toBe(userData.providerId);
            expect(savedUser.apiToken).toBeUndefined();
            expect(savedUser.apiTokenCreatedAt).toBeUndefined();
            expect(savedUser.apiTokenLastUsedAt).toBeUndefined();
        });

        it('should create a user with API token fields', async () => {
            const now = new Date();
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const,
                providerId: 'github123',
                apiToken: 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                apiTokenCreatedAt: now,
                apiTokenLastUsedAt: now,
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.apiToken).toBe(userData.apiToken);
            expect(savedUser.apiTokenCreatedAt).toEqual(userData.apiTokenCreatedAt);
            expect(savedUser.apiTokenLastUsedAt).toEqual(userData.apiTokenLastUsedAt);
        });

        it('should allow null values for API token fields', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const,
                providerId: 'github123',
                apiToken: null,
                apiTokenCreatedAt: null,
                apiTokenLastUsedAt: null,
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.apiToken).toBeNull();
            expect(savedUser.apiTokenCreatedAt).toBeNull();
            expect(savedUser.apiTokenLastUsedAt).toBeNull();
        });

        it('should enforce unique constraint on apiToken', async () => {
            const token = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            // Create first user with token
            const user1 = new User({
                email: 'test1@example.com',
                name: 'Test User 1',
                provider: 'github' as const,
                providerId: 'github123',
                apiToken: token,
            });
            await user1.save();

            // Try to create second user with same token
            const user2 = new User({
                email: 'test2@example.com',
                name: 'Test User 2',
                provider: 'github' as const,
                providerId: 'github456',
                apiToken: token,
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should allow multiple users with null apiToken (sparse index)', async () => {
            // Create first user without token
            const user1 = new User({
                email: 'test1@example.com',
                name: 'Test User 1',
                provider: 'github' as const,
                providerId: 'github123',
            });
            await user1.save();

            // Create second user without token
            const user2 = new User({
                email: 'test2@example.com',
                name: 'Test User 2',
                provider: 'github' as const,
                providerId: 'github456',
            });
            await user2.save();

            // Both should be saved successfully
            expect(user1._id).toBeDefined();
            expect(user2._id).toBeDefined();
        });

        it('should update apiTokenLastUsedAt independently', async () => {
            const now = new Date();
            const user = new User({
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const,
                providerId: 'github123',
                apiToken: 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                apiTokenCreatedAt: now,
            });
            const savedUser = await user.save();

            // Update lastUsedAt
            const laterTime = new Date(now.getTime() + 60000); // 1 minute later
            savedUser.apiTokenLastUsedAt = laterTime;
            const updatedUser = await savedUser.save();

            expect(updatedUser.apiTokenCreatedAt).toEqual(now);
            expect(updatedUser.apiTokenLastUsedAt).toEqual(laterTime);
        });

        it('should trim apiToken whitespace', async () => {
            const token = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            const user = new User({
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const,
                providerId: 'github123',
                apiToken: `  ${token}  `, // With whitespace
            });
            const savedUser = await user.save();

            expect(savedUser.apiToken).toBe(token); // Should be trimmed
        });
    });

    describe('Existing Functionality', () => {
        it('should maintain existing user creation functionality', async () => {
            const userData = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'discord' as const,
                providerId: 'discord123',
                discordUsername: 'testuser',
                discordDiscriminator: '1234',
                discordGlobalName: 'Test User Global',
                discordVerified: true,
                discordLocale: 'en-US',
            };

            const user = new User(userData);
            const savedUser = await user.save();

            expect(savedUser.email).toBe(userData.email);
            expect(savedUser.discordUsername).toBe(userData.discordUsername);
            expect(savedUser.discordDiscriminator).toBe(userData.discordDiscriminator);
            expect(savedUser.discordGlobalName).toBe(userData.discordGlobalName);
            expect(savedUser.discordVerified).toBe(userData.discordVerified);
            expect(savedUser.discordLocale).toBe(userData.discordLocale);
        });

        it('should enforce required fields', async () => {
            const user = new User({
                // Missing required fields
                name: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should enforce unique email constraint', async () => {
            const email = 'test@example.com';

            // Create first user
            const user1 = new User({
                email,
                name: 'Test User 1',
                provider: 'github' as const,
                providerId: 'github123',
            });
            await user1.save();

            // Try to create second user with same email
            const user2 = new User({
                email,
                name: 'Test User 2',
                provider: 'github' as const,
                providerId: 'github456',
            });

            await expect(user2.save()).rejects.toThrow();
        });

        it('should enforce unique provider + providerId constraint', async () => {
            const provider = 'github' as const;
            const providerId = 'github123';

            // Create first user
            const user1 = new User({
                email: 'test1@example.com',
                name: 'Test User 1',
                provider,
                providerId,
            });
            await user1.save();

            // Try to create second user with same provider + providerId
            const user2 = new User({
                email: 'test2@example.com',
                name: 'Test User 2',
                provider,
                providerId,
            });

            await expect(user2.save()).rejects.toThrow();
        });
    });
});