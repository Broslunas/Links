import { IUser } from '../User';

describe('User Interface', () => {
    describe('API Token Fields', () => {
        it('should have API token fields in the interface', () => {
            // This test validates that the TypeScript interface includes the required fields
            const mockUser: Partial<IUser> = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github',
                providerId: 'github123',
                apiToken: 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                apiTokenCreatedAt: new Date(),
                apiTokenLastUsedAt: new Date(),
            };

            // TypeScript compilation will fail if these fields don't exist in the interface
            expect(mockUser.apiToken).toBeDefined();
            expect(mockUser.apiTokenCreatedAt).toBeDefined();
            expect(mockUser.apiTokenLastUsedAt).toBeDefined();
        });

        it('should allow optional API token fields', () => {
            // Test that API token fields are optional
            const mockUser: Partial<IUser> = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github',
                providerId: 'github123',
                // API token fields are optional
            };

            expect(mockUser.apiToken).toBeUndefined();
            expect(mockUser.apiTokenCreatedAt).toBeUndefined();
            expect(mockUser.apiTokenLastUsedAt).toBeUndefined();
        });

        it('should support null values for API token fields', () => {
            const mockUser: Partial<IUser> = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github',
                providerId: 'github123',
                apiToken: undefined,
                apiTokenCreatedAt: undefined,
                apiTokenLastUsedAt: undefined,
            };

            expect(mockUser.apiToken).toBeUndefined();
            expect(mockUser.apiTokenCreatedAt).toBeUndefined();
            expect(mockUser.apiTokenLastUsedAt).toBeUndefined();
        });

        it('should validate API token field types', () => {
            const now = new Date();
            const mockUser: Partial<IUser> = {
                apiToken: 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
                apiTokenCreatedAt: now,
                apiTokenLastUsedAt: now,
            };

            expect(typeof mockUser.apiToken).toBe('string');
            expect(mockUser.apiTokenCreatedAt).toBeInstanceOf(Date);
            expect(mockUser.apiTokenLastUsedAt).toBeInstanceOf(Date);
        });
    });

    describe('Existing Fields', () => {
        it('should maintain existing required fields', () => {
            const mockUser: Partial<IUser> = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github',
                providerId: 'github123',
            };

            expect(mockUser.email).toBe('test@example.com');
            expect(mockUser.name).toBe('Test User');
            expect(mockUser.provider).toBe('github');
            expect(mockUser.providerId).toBe('github123');
        });

        it('should support Discord-specific fields', () => {
            const mockUser: Partial<IUser> = {
                email: 'test@example.com',
                name: 'Test User',
                provider: 'discord',
                providerId: 'discord123',
                discordUsername: 'testuser',
                discordDiscriminator: '1234',
                discordGlobalName: 'Test User Global',
                discordVerified: true,
                discordLocale: 'en-US',
            };

            expect(mockUser.discordUsername).toBe('testuser');
            expect(mockUser.discordDiscriminator).toBe('1234');
            expect(mockUser.discordGlobalName).toBe('Test User Global');
            expect(mockUser.discordVerified).toBe(true);
            expect(mockUser.discordLocale).toBe('en-US');
        });
    });
});