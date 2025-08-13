import mongoose from 'mongoose';
import { Session } from 'next-auth';

/**
 * Validates and converts a user ID to a MongoDB ObjectId
 */
export function validateAndConvertUserId(userId: string | undefined): mongoose.Types.ObjectId | null {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
    }
    return new mongoose.Types.ObjectId(userId);
}

/**
 * Validates a user session and returns a valid ObjectId
 */
export function validateUserSession(session: Session | null): {
    isValid: boolean;
    userId: mongoose.Types.ObjectId | null;
    error?: string;
} {
    if (!session?.user?.id) {
        return {
            isValid: false,
            userId: null,
            error: 'Authentication required'
        };
    }

    const userId = validateAndConvertUserId(session.user.id);
    if (!userId) {
        return {
            isValid: false,
            userId: null,
            error: 'Invalid user session. Please sign out and sign in again.'
        };
    }

    return {
        isValid: true,
        userId
    };
}

/**
 * Checks if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
}