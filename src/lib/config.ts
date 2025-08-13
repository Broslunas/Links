// Configuration validation
const requiredEnvVars = [
    'MONGODB_URI',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
] as const;

const optionalEnvVars = [
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DISCORD_CLIENT_ID',
    'DISCORD_CLIENT_SECRET',
] as const;

// Validate required environment variables
export function validateConfig() {
    const missing: string[] = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Check if at least one OAuth provider is configured
    const hasGithub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
    const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
    const hasDiscord = process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET;

    if (!hasGithub && !hasGoogle && !hasDiscord) {
        console.warn('Warning: No OAuth providers configured. At least one provider (GitHub, Google, or Discord) should be configured.');
    }
}

// Call validation on import (only in server-side)
if (typeof window === 'undefined') {
    try {
        validateConfig();
    } catch (error) {
        console.error('Configuration error:', error);
    }
}

export const config = {
    mongodb: {
        uri: process.env.MONGODB_URI!,
    },
    nextAuth: {
        url: process.env.NEXTAUTH_URL!,
        secret: process.env.NEXTAUTH_SECRET!,
    },
    oauth: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        discord: {
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
        },
    },
    app: {
        url: process.env.APP_URL || process.env.NEXTAUTH_URL!,
    },
} as const;