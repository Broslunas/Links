import { validateAndConvertUserId, validateUserSession, isValidObjectId } from '../user-utils';
import { Session } from 'next-auth';

describe('user-utils', () => {
    describe('isValidObjectId', () => {
        it('should return true for valid ObjectIds', () => {
            expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
            expect(isValidObjectId('507f191e810c19729de860ea')).toBe(true);
        });

        it('should return false for invalid ObjectIds', () => {
            expect(isValidObjectId('invalid')).toBe(false);
            expect(isValidObjectId('186413780')).toBe(false); // GitHub user ID
            expect(isValidObjectId('')).toBe(false);
            expect(isValidObjectId('123')).toBe(false);
        });
    });

    describe('validateAndConvertUserId', () => {
        it('should convert valid ObjectId strings to ObjectId', () => {
            const validId = '507f1f77bcf86cd799439011';
            const result = validateAndConvertUserId(validId);

            expect(result).not.toBeNull();
            expect(result?.toString()).toBe(validId);
        });

        it('should return null for invalid ObjectIds', () => {
            expect(validateAndConvertUserId('invalid')).toBeNull();
            expect(validateAndConvertUserId('186413780')).toBeNull();
            expect(validateAndConvertUserId(undefined)).toBeNull();
            expect(validateAndConvertUserId('')).toBeNull();
        });
    });

    describe('validateUserSession', () => {
        it('should return valid result for valid session', () => {
            const session: Session = {
                user: {
                    id: '507f1f77bcf86cd799439011',
                    email: 'test@example.com',
                    name: 'Test User'
                },
                expires: '2024-12-31'
            };

            const result = validateUserSession(session);

            expect(result.isValid).toBe(true);
            expect(result.userId).not.toBeNull();
            expect(result.userId?.toString()).toBe('507f1f77bcf86cd799439011');
            expect(result.error).toBeUndefined();
        });

        it('should return invalid result for null session', () => {
            const result = validateUserSession(null);

            expect(result.isValid).toBe(false);
            expect(result.userId).toBeNull();
            expect(result.error).toBe('Authentication required');
        });

        it('should return invalid result for session with invalid user ID', () => {
            const session: Session = {
                user: {
                    id: '186413780', // GitHub user ID, not MongoDB ObjectId
                    email: 'test@example.com',
                    name: 'Test User'
                },
                expires: '2024-12-31'
            };

            const result = validateUserSession(session);

            expect(result.isValid).toBe(false);
            expect(result.userId).toBeNull();
            expect(result.error).toBe('Invalid user session. Please sign out and sign in again.');
        });

        it('should return invalid result for session without user ID', () => {
            const session: Session = {
                user: {
                    email: 'test@example.com',
                    name: 'Test User'
                } as any,
                expires: '2024-12-31'
            };

            const result = validateUserSession(session);

            expect(result.isValid).toBe(false);
            expect(result.userId).toBeNull();
            expect(result.error).toBe('Authentication required');
        });
    });
});