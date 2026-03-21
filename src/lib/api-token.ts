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
 * Generate a secure Extension token
 */
export function generateExtensionToken(): string {
    // Generate a random token with prefix for identification
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `ext_${randomBytes}`;
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
 * Generate and save Extension token for a user
 */
export async function generateUserExtensionToken(userId: string): Promise<string> {
    let token: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure token uniqueness
    while (!isUnique && attempts < maxAttempts) {
        token = generateExtensionToken();
        const existingUser = await User.findOne({ 
            $or: [
                { apiToken: token },
                { extensionToken: token }
            ]
        });

        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Failed to generate unique extension token');
    }

    // Update user with new token
    await User.findByIdAndUpdate(userId, {
        extensionToken: token!,
        extensionTokenCreatedAt: new Date(),
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

    // Check if token starts with 'uls_' or 'ext_' and has exactly 64 hex characters after
    const tokenRegex = /^(uls|ext)_[a-f0-9]{64}$/;
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
        // Check both token fields
        const user = await User.findOne({ 
            $or: [
                { apiToken: token },
                { extensionToken: token }
            ]
        });
        return user;
    } catch (error) {
        console.error('[validateApiToken] Error validating token:', error);
        // Return null instead of throwing to allow graceful degradation
        return null;
    }
}

/**
 * Update the lastUsedAt timestamp for any token type
 */
export async function updateTokenLastUsed(userId: string, token: string): Promise<void> {
    try {
        const isExtension = token.startsWith('ext_');
        const updateField = isExtension ? 'extensionTokenLastUsedAt' : 'apiTokenLastUsedAt';
        
        await User.findByIdAndUpdate(userId, {
            [updateField]: new Date(),
        });
    } catch (error) {
        console.error('[updateTokenLastUsed] Error updating token last used:', error);
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