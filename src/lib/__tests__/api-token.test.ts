import { generateApiToken, validateApiToken } from '../api-token';

// Mock User model
jest.mock('../../models/User', () => ({
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
}));

describe('API Token Utils', () => {
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
    });

    describe('validateApiToken', () => {
        const User = require('../../models/User');

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return null for invalid token format', async () => {
            const result = await validateApiToken('invalid-token');
            expect(result).toBeNull();
            expect(User.findOne).not.toHaveBeenCalled();
        });

        it('should return null for token without correct prefix', async () => {
            const result = await validateApiToken('wrong_prefix_token');
            expect(result).toBeNull();
            expect(User.findOne).not.toHaveBeenCalled();
        });

        it('should return user for valid token', async () => {
            const mockUser = { _id: 'user123', email: 'test@example.com' };
            User.findOne.mockResolvedValue(mockUser);

            const result = await validateApiToken('uls_validtoken123');

            expect(User.findOne).toHaveBeenCalledWith({ apiToken: 'uls_validtoken123' });
            expect(result).toBe(mockUser);
        });

        it('should return null for token not found in database', async () => {
            User.findOne.mockResolvedValue(null);

            const result = await validateApiToken('uls_nonexistenttoken');

            expect(User.findOne).toHaveBeenCalledWith({ apiToken: 'uls_nonexistenttoken' });
            expect(result).toBeNull();
        });
    });
});