import { connectDB } from './db-utils';
import { extractAnalyticsData, hashIP } from './analytics';
import Link from '../models/Link';
import TempLink from '../models/TempLink';
import AnalyticsEvent from '../models/AnalyticsEvent';
import CustomDomain from '../models/CustomDomain';

export interface RedirectResult {
    success: boolean;
    originalUrl?: string;
    error?: string;
    customDomain?: string;
    shouldRedirectToMain?: boolean;
    mainDomainUrl?: string;
}

/**
 * Extract domain from request headers
 */
function extractDomainFromRequest(request: Request): string {
    const url = new URL(request.url);
    // Include port for localhost and development environments
    if (url.hostname === 'localhost' && url.port) {
        return `${url.hostname}:${url.port}`;
    }
    return url.hostname;
}

/**
 * Handle URL redirection with analytics tracking and custom domain support
 */
export async function handleRedirect(
    slug: string,
    request: Request
): Promise<RedirectResult> {
    console.log('🚀 handleRedirect called with slug:', slug);
    console.log('🌐 Request URL:', request.url);
    
    try {
        await connectDB();

        // Extract domain from request
        const requestDomain = extractDomainFromRequest(request);
        console.log('🔍 Processing slug:', slug, 'on domain:', requestDomain);
        let customDomain = null;
        let domainFilter = {};

        // Check if this is a custom domain request
        if (requestDomain !== process.env.DEFAULT_DOMAIN && 
            !requestDomain.startsWith('localhost:') && 
            requestDomain !== 'broslunas.link' && 
            requestDomain !== 'www.broslunas.link') {
            customDomain = await CustomDomain.findOne({
                fullDomain: requestDomain,
                isVerified: true,
                isActive: true
            });

            if (!customDomain) {
                return {
                    success: false,
                    error: 'Dominio personalizado no encontrado o no verificado'
                };
            }

            // Allow all links on custom domains (no domain filtering)
            domainFilter = {};
        } else {
            // For default domain, only show links without custom domain or with default domain
            domainFilter = {
                $or: [
                    { customDomain: { $exists: false } },
                    { customDomain: null }
                ]
            };
        }

        // First, check if the link exists but is expired (both in Link and TempLink collections)
        const [expiredLink, expiredTempLink] = await Promise.all([
            Link.findOne({
                slug: slug.toLowerCase(),
                ...domainFilter,
                $or: [
                    { isExpired: true },
                    { 
                        isTemporary: true,
                        expiresAt: { $lte: new Date() }
                    }
                ]
            }),
            TempLink.findOne({
                slug: slug.toLowerCase(),
                expiresAt: { $lte: new Date() }
            })
        ]);

        if (expiredLink || expiredTempLink) {
            return {
                success: false,
                error: 'Este enlace ha expirado y ya no está disponible'
            };
        }

        // Temporary hardcoded link for testing
        if (slug.toLowerCase() === 'test') {
            console.log('🔍 Returning hardcoded test link');
            return {
                success: true,
                originalUrl: 'https://google.com'
            };
        }
        
        console.log('🔍 Processing slug:', slug, 'domain:', requestDomain);

        // Find the link by slug (check both regular links and temporary links)
        const [link, tempLink] = await Promise.all([
            Link.findOne({
                slug: slug.toLowerCase(),
                ...domainFilter,
                isActive: true,
                isDisabledByAdmin: { $ne: true }, // Exclude links disabled by admin
                isExpired: { $ne: true }, // Exclude expired links
                $or: [
                    { isTemporary: { $ne: true } }, // Non-temporary links
                    { 
                        isTemporary: true,
                        expiresAt: { $gt: new Date() } // Only non-expired temporary links
                    }
                ]
            }),
            // Note: TempLink doesn't support custom domains yet
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
                error: 'Link not found, inactive, or disabled'
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
            originalUrl: targetLink.originalUrl,
            customDomain: customDomain?.fullDomain
        };

    } catch (error) {
        console.error('❌ Error in handleRedirect:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Check if a request from custom domain should redirect to main domain
 */
export async function shouldRedirectToMainDomain(
    pathname: string,
    request: Request
): Promise<RedirectResult> {
    try {
        const requestDomain = extractDomainFromRequest(request);
        const mainDomain = process.env.NEXT_PUBLIC_APP_URL || 'https://broslunas.link';
        
        // If it's the main domain or localhost, no redirect needed
        if (requestDomain === process.env.DEFAULT_DOMAIN || 
            requestDomain === 'localhost:3000' ||
            requestDomain === 'localhost' ||
            requestDomain === '127.0.0.1' ||
            requestDomain === 'broslunas.link' ||
            requestDomain === 'www.broslunas.link' ||
            requestDomain.includes('vercel.app')) {
            return { success: true };
        }
        
        // Check if this is a custom domain request
        await connectDB();
        const customDomain = await CustomDomain.findOne({
            fullDomain: requestDomain,
            isVerified: true,
            isActive: true
        });
        
        if (!customDomain) {
            return {
                success: false,
                error: 'Dominio personalizado no encontrado o no verificado'
            };
        }
        
        // If it's root path, redirect to main domain
        if (pathname === '/') {
            return {
                success: true,
                shouldRedirectToMain: true,
                mainDomainUrl: mainDomain
            };
        }
        
        // If it's not a valid slug format, redirect to main domain with same path
        const slug = pathname.slice(1);
        if (!isValidSlug(slug)) {
            return {
                success: true,
                shouldRedirectToMain: true,
                mainDomainUrl: `${mainDomain}${pathname}`
            };
        }
        
        // Check if the slug exists as a valid link (available on all domains)
        const link = await Link.findOne({
            slug: slug.toLowerCase(),
            isActive: true,
            isDisabledByAdmin: { $ne: true },
            isExpired: { $ne: true },
            $or: [
                { isTemporary: { $ne: true } },
                { 
                    isTemporary: true,
                    expiresAt: { $gt: new Date() }
                }
            ]
        });
        
        // If no link found, redirect to main domain with same path
        if (!link) {
            return {
                success: true,
                shouldRedirectToMain: true,
                mainDomainUrl: `${mainDomain}${pathname}`
            };
        }
        
        // Link exists, allow normal processing
        return { success: true };
        
    } catch (error) {
        console.error('Error checking redirect to main domain:', error);
        return {
            success: false,
            error: 'Error interno del servidor'
        };
    }
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
    console.log('🔍 isValidSlug called with:', slug);
    
    if (!slug || typeof slug !== 'string') {
        console.log('❌ isValidSlug: Invalid type or empty slug');
        return false;
    }

    // Check length
    if (slug.length < 1 || slug.length > 50) {
        console.log('❌ isValidSlug: Invalid length:', slug.length);
        return false;
    }

    // Check format (lowercase letters, numbers, hyphens, underscores)
    const isValid = /^[a-z0-9-_]+$/.test(slug);
    console.log('🔍 isValidSlug result for', slug, ':', isValid);
    return isValid;
}