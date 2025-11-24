import crypto from 'crypto';
import User from '../models/User';

/**
 * Generate a secure API token
 */
export function generateApiToken(): string {
    // Generate a random token with prefix for identification
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `uls_${randomBytes}`;
}

/**
 * Generate and save API token for a user
 */
export async function generateUserApiToken(userId: string): Promise<string> {
    let token: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure token uniqueness
    while (!isUnique && attempts < maxAttempts) {
        token = generateApiToken();
        const existingUser = await User.findOne({ apiToken: token });

        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique API token');
    }

    // Update user with new token
    await User.findByIdAndUpdate(userId, {
        apiToken: token!,
        apiTokenCreatedAt: new Date(),
    });

    return token!;
}

/**
 * Validate API token format
 */
export function isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
        return false;
    }

    // Check if token starts with 'uls_' and has exactly 64 hex characters after
    const tokenRegex = /^uls_[a-f0-9]{64}$/;
    return tokenRegex.test(token);
}

/**
 * Validate API token and return user
 */
export async function validateApiToken(token: string) {
    if (!isValidTokenFormat(token)) {
        return null;
    }

    try {
        // Ensure database connection before querying
        const user = await User.findOne({ apiToken: token });
        return user;
    } catch (error) {
        console.error('[validateApiToken] Error validating token:', error);
        // Return null instead of throwing to allow graceful degradation
        return null;
    }
}

/**
 * Update the lastUsedAt timestamp for an API token
 */
export async function updateTokenLastUsed(userId: string): Promise<void> {
    try {
        await User.findByIdAndUpdate(userId, {
            apiTokenLastUsedAt: new Date(),
        });
    } catch (error) {
        console.error('[updateTokenLastUsed] Error updating token last used:', error);
        // Don't throw, just log the error
    }
}

/**
 * Revoke API token for a user
 */
export async function revokeApiToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
        $unset: {
            apiToken: 1,
            apiTokenCreatedAt: 1,
            apiTokenLastUsedAt: 1,
        },
    });
}