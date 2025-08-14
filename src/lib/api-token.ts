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
 * Validate API token and return user
 */
export async function validateApiToken(token: string) {
    if (!token || !token.startsWith('uls_')) {
        return null;
    }

    const user = await User.findOne({ apiToken: token });
    return user;
}

/**
 * Revoke API token for a user
 */
export async function revokeApiToken(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
        $unset: {
            apiToken: 1,
            apiTokenCreatedAt: 1,
        },
    });
}