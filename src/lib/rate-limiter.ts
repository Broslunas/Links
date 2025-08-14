// Simple in-memory rate limiter for temporary links
// In production, you'd want to use Redis or a proper rate limiting service

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class InMemoryRateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    private cleanup() {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.store.forEach((entry, key) => {
            if (now > entry.resetTime) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.store.delete(key));
    }

    async checkRateLimit(
        identifier: string,
        limit: number,
        windowMs: number
    ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        const now = Date.now();
        const key = `rate_limit:${identifier}`;

        let entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            // Create new entry or reset expired one
            entry = {
                count: 0,
                resetTime: now + windowMs,
            };
        }

        entry.count++;
        this.store.set(key, entry);

        const allowed = entry.count <= limit;
        const remaining = Math.max(0, limit - entry.count);

        return {
            allowed,
            remaining,
            resetTime: entry.resetTime,
        };
    }

    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.store.clear();
    }
}

// Global instance
const rateLimiter = new InMemoryRateLimiter();

export { rateLimiter };

// Helper function for API routes
export async function checkTempLinkRateLimit(ip: string) {
    // Allow 5 temporary links per hour per IP
    const limit = 5;
    const windowMs = 60 * 60 * 1000; // 1 hour

    return await rateLimiter.checkRateLimit(ip, limit, windowMs);
}