import {
    generateApiToken,
    generateUserApiToken,
    validateApiToken,
    revokeApiToken,
    isValidTokenFormat,
    updateTokenLastUsed,
} from '../api-token';

// Mock the User model
jest.mock('../../models/User', () => ({
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

import User from '../../models/User';

const mockUser = User as jest.Mocked<typeof User>;

describe('API Token Utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateApiToken', () => {
        it('should generate a token with correct prefix', () => {
            const token = generateApiToken();
            expect(token).toMatch(/^uls_[a-f0-9]{64}$/);
        });

        it('should generate unique tokens', () => {
            const token1 = generateApiToken();
            const token2 = generateApiToken();
            expect(token1).not.toBe(token2);
        });

        it('should generate tokens with correct length', () => {
            const token = generateApiToken();
            expect(token.length).toBe(68); // 'uls_' (4) + 64 hex chars
        });
    });

    describe('isValidTokenFormat', () => {
        it('should validate correct token format', () => {
            const validToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            expect(isValidTokenFormat(validToken)).toBe(true);
        });

        it('should reject tokens without prefix', () => {
            const invalidToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            expect(isValidTokenFormat(invalidToken)).toBe(false);
        });

        it('should reject tokens with wrong prefix', () => {
            const invalidToken = 'abc_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            expect(isValidTokenFormat(invalidToken)).toBe(false);
        });

        it('should reject tokens with incorrect length', () => {
            const shortToken = 'uls_123456';
            const longToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123';
            expect(isValidTokenFormat(shortToken)).toBe(false);
            expect(isValidTokenFormat(longToken)).toBe(false);
        });

        it('should reject tokens with non-hex characters', () => {
            const invalidToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg';
            expect(isValidTokenFormat(invalidToken)).toBe(false);
        });

        it('should reject uppercase hex characters', () => {
            const invalidToken = 'uls_1234567890ABCDEF1234567890abcdef1234567890abcdef1234567890abcdef';
            expect(isValidTokenFormat(invalidToken)).toBe(false);
        });

        it('should reject null, undefined, and non-string values', () => {
            expect(isValidTokenFormat(null as any)).toBe(false);
            expect(isValidTokenFormat(undefined as any)).toBe(false);
            expect(isValidTokenFormat(123 as any)).toBe(false);
            expect(isValidTokenFormat({} as any)).toBe(false);
            expect(isValidTokenFormat([] as any)).toBe(false);
        });

        it('should reject empty string', () => {
            expect(isValidTokenFormat('')).toBe(false);
        });
    });

    describe('generateUserApiToken', () => {
        it('should generate and save a unique token for user', async () => {
            const userId = 'user123';
            mockUser.findOne.mockResolvedValue(null); // No existing token
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);

            const token = await generateUserApiToken(userId);

            expect(token).toMatch(/^uls_[a-f0-9]{64}$/);
            expect(mockUser.findOne).toHaveBeenCalledWith({ apiToken: token });
            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
                apiToken: token,
                apiTokenCreatedAt: expect.any(Date),
            });
        });

        it('should retry if token already exists', async () => {
            const userId = 'user123';
            mockUser.findOne
                .mockResolvedValueOnce({ _id: 'other-user' } as any) // First token exists
                .mockResolvedValueOnce(null); // Second token is unique
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);

            const token = await generateUserApiToken(userId);

            expect(token).toMatch(/^uls_[a-f0-9]{64}$/);
            expect(mockUser.findOne).toHaveBeenCalledTimes(2);
            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
                apiToken: token,
                apiTokenCreatedAt: expect.any(Date),
            });
        });

        it('should throw error if unable to generate unique token after max attempts', async () => {
            const userId = 'user123';
            mockUser.findOne.mockResolvedValue({ _id: 'other-user' } as any); // Always exists

            await expect(generateUserApiToken(userId)).rejects.toThrow('Failed to generate unique API token');
            expect(mockUser.findOne).toHaveBeenCalledTimes(5); // Max attempts
            expect(mockUser.findByIdAndUpdate).not.toHaveBeenCalled();
        });
    });

    describe('validateApiToken', () => {
        it('should return user for valid token', async () => {
            const validToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            const mockUserDoc = { _id: 'user123', email: 'test@example.com' };
            mockUser.findOne.mockResolvedValue(mockUserDoc as any);

            const result = await validateApiToken(validToken);

            expect(result).toBe(mockUserDoc);
            expect(mockUser.findOne).toHaveBeenCalledWith({ apiToken: validToken });
        });

        it('should return null for invalid token format', async () => {
            const invalidToken = 'invalid-token';

            const result = await validateApiToken(invalidToken);

            expect(result).toBeNull();
            expect(mockUser.findOne).not.toHaveBeenCalled();
        });

        it('should return null for non-existent token', async () => {
            const validToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            mockUser.findOne.mockResolvedValue(null);

            const result = await validateApiToken(validToken);

            expect(result).toBeNull();
            expect(mockUser.findOne).toHaveBeenCalledWith({ apiToken: validToken });
        });
    });

    describe('updateTokenLastUsed', () => {
        it('should update apiTokenLastUsedAt for user', async () => {
            const userId = 'user123';
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);

            await updateTokenLastUsed(userId);

            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
                apiTokenLastUsedAt: expect.any(Date),
            });
        });

        it('should use current timestamp', async () => {
            const userId = 'user123';
            const beforeCall = new Date();
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);

            await updateTokenLastUsed(userId);

            const afterCall = new Date();
            const callArgs = mockUser.findByIdAndUpdate.mock.calls[0][1] as any;
            const timestamp = callArgs.apiTokenLastUsedAt;

            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });
    });

    describe('revokeApiToken', () => {
        it('should remove all API token fields from user', async () => {
            const userId = 'user123';
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);

            await revokeApiToken(userId);

            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
                $unset: {
                    apiToken: 1,
                    apiTokenCreatedAt: 1,
                    apiTokenLastUsedAt: 1,
                },
            });
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete token lifecycle', async () => {
            const userId = 'user123';

            // Generate token
            mockUser.findOne.mockResolvedValue(null);
            mockUser.findByIdAndUpdate.mockResolvedValue({} as any);
            const token = await generateUserApiToken(userId);

            // Validate token
            const mockUserDoc = { _id: userId, apiToken: token };
            mockUser.findOne.mockResolvedValue(mockUserDoc as any);
            const validatedUser = await validateApiToken(token);
            expect(validatedUser).toBe(mockUserDoc);

            // Update last used
            await updateTokenLastUsed(userId);

            // Revoke token
            await revokeApiToken(userId);

            expect(mockUser.findByIdAndUpdate).toHaveBeenCalledTimes(3);
        });
    });
});