import { connectDB } from './db-utils';
import { extractAnalyticsData, hashIP } from './analytics';
import Link from '../models/Link';
import TempLink from '../models/TempLink';
import AnalyticsEvent from '../models/AnalyticsEvent';
import Domain from '../models/Domain';

/**
 * Extract custom domain from request headers
 */
export function extractCustomDomain(request: Request): string | undefined {
    const host = request.headers.get('host');
    if (!host) return undefined;

    // Remove port if present
    const domain = host.split(':')[0].toLowerCase();
    
    // Skip localhost and default domains
    const defaultDomains = [
        'localhost',
        '127.0.0.1',
        'broslunas.link',
        'www.broslunas.link',
        process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
    ].filter(Boolean);
    
    if (defaultDomains.includes(domain)) {
        return undefined;
    }
    
    return domain;
}

/**
 * Verify if a custom domain is valid and verified
 */
export async function isValidCustomDomain(domain: string): Promise<boolean> {
    try {
        await connectDB();
        const domainRecord = await Domain.findOne({
            domain: domain.toLowerCase(),
            isVerified: true,
            isActive: true
        });
        return !!domainRecord;
    } catch (error) {
        console.error('Error checking custom domain:', error);
        return false;
    }
}

export interface RedirectResult {
    success: boolean;
    originalUrl?: string;
    error?: string;
}

/**
 * Handle URL redirection with analytics tracking
 * @param slug - The slug to redirect
 * @param request - The incoming request
 * @param customDomain - Optional custom domain to filter links by
 */
export async function handleRedirect(
    slug: string,
    request: Request,
    customDomain?: string
): Promise<RedirectResult> {
    try {
        await connectDB();

        // Extract custom domain from request if not provided
        if (!customDomain) {
            customDomain = extractCustomDomain(request);
        }

        // Verify custom domain if present
        if (customDomain && !(await isValidCustomDomain(customDomain))) {
            return {
                success: false,
                error: 'Invalid or unverified custom domain'
            };
        }

        // Build query for regular links
        const linkQuery: any = {
            slug: slug.toLowerCase(),
            isActive: true
        };

        // If custom domain is provided, filter by it
        if (customDomain) {
            linkQuery.customDomain = customDomain.toLowerCase();
        } else {
            // If no custom domain, only find links without custom domain
            linkQuery.$or = [
                { customDomain: { $exists: false } },
                { customDomain: null },
                { customDomain: '' }
            ];
        }

        // Find the link by slug (check both regular links and temporary links)
        const [link, tempLink] = await Promise.all([
            Link.findOne(linkQuery),
            TempLink.findOne({
                slug: slug.toLowerCase(),
                expiresAt: { $gt: new Date() } // Only non-expired temp links
            })
        ]);

        // Determine which link to use (regular links take precedence)
        const targetLink = link || tempLink;
        const isTemporary = !link && !!tempLink;

        if (!targetLink) {
            return {
                success: false,
                error: 'Link not found, inactive, or expired'
            };
        }

        // Extract analytics data
        const analyticsData = await extractAnalyticsData(request);

        // Get client IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const realIP = request.headers.get('x-real-ip');
        const cfConnectingIP = request.headers.get('cf-connecting-ip');

        let clientIP = '127.0.0.1';
        if (forwardedFor) {
            clientIP = forwardedFor.split(',')[0].trim();
        } else if (realIP) {
            clientIP = realIP;
        } else if (cfConnectingIP) {
            clientIP = cfConnectingIP;
        }

        // Record analytics event (fire and forget - don't block redirect)
        try {
            const analyticsEvent = new AnalyticsEvent({
                linkId: targetLink._id,
                ip: hashIP(clientIP),
                country: analyticsData.country,
                city: analyticsData.city,
                region: analyticsData.region,
                language: analyticsData.language,
                userAgent: analyticsData.userAgent,
                device: analyticsData.device,
                os: analyticsData.os,
                browser: analyticsData.browser,
                referrer: analyticsData.referrer,
            });

            // Save analytics event and increment click count in parallel
            const updatePromises = [analyticsEvent.save()];

            if (isTemporary) {
                // Update temporary link click count
                updatePromises.push(
                    TempLink.findByIdAndUpdate(targetLink._id, { $inc: { clickCount: 1 } })
                );
            } else {
                // Update regular link click count
                updatePromises.push(
                    Link.findByIdAndUpdate(targetLink._id, { $inc: { clickCount: 1 } })
                );
            }

            await Promise.all(updatePromises);
        } catch (analyticsError) {
            // Log the error but don't block the redirect
            console.error('Error recording analytics:', analyticsError);
        }

        return {
            success: true,
            originalUrl: targetLink.originalUrl
        };

    } catch (error) {
        console.error('Error in redirect handler:', error);
        return {
            success: false,
            error: 'Internal server error'
        };
    }
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
    if (!slug || typeof slug !== 'string') {
        return false;
    }

    // Check length
    if (slug.length < 1 || slug.length > 50) {
        return false;
    }

    // Check format (lowercase letters, numbers, hyphens, underscores)
    return /^[a-z0-9-_]+$/.test(slug);
}