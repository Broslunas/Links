import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';
import { AnalyticsData } from '../types';
import { getGeolocationForRequest, geolocationService } from './geolocation-service';

/**
 * Hash IP address for privacy protection
 */
export function hashIP(ip: string): string {
    return geolocationService.hashIP(ip);
}

/**
 * Get client IP address from request headers (DEPRECATED - use geolocation service)
 * @deprecated Use geolocationService.detectClientIP() instead
 */
export function getClientIP(request: Request): string {
    const result = geolocationService.detectClientIP(request);
    return result.ip;
}

/**
 * Get geographic information from IP address (DEPRECATED - use geolocation service)
 * @deprecated Use geolocationService.getGeolocation() instead
 */
export async function getGeoInfo(ip: string) {
    console.log(`[Analytics] DEPRECATED: getGeoInfo called for IP: ${ip}. Use geolocationService instead.`);
    return await geolocationService.getGeolocation(ip);
}

/**
 * Parse user agent to extract device, OS, and browser information
 */
export function parseUserAgent(userAgent: string) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Determine device type
    let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';

    if (result.device.type === 'mobile') {
        device = 'mobile';
    } else if (result.device.type === 'tablet') {
        device = 'tablet';
    }

    return {
        device,
        os: result.os.name || 'Unknown',
        browser: result.browser.name || 'Unknown'
    };
}

/**
 * Get browser language from Accept-Language header
 */
export function getBrowserLanguage(request: Request): string {
    const acceptLanguage = request.headers.get('accept-language');

    if (!acceptLanguage) {
        return 'en';
    }

    // Parse the Accept-Language header and get the first language
    const languages = acceptLanguage.split(',');
    const primaryLanguage = languages[0]?.split(';')[0]?.trim();

    return primaryLanguage || 'en';
}

/**
 * Extract analytics data from request using new geolocation service
 */
export async function extractAnalyticsData(request: Request): Promise<AnalyticsData> {
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || undefined;
    const language = getBrowserLanguage(request);

    // Use new geolocation service
    const { ipInfo, geoInfo } = await getGeolocationForRequest(request);
    const userAgentInfo = parseUserAgent(userAgent);

    console.log(`🔍 [Analytics] Extracted data for IP ${ipInfo.ip}:`, {
        country: geoInfo.country,
        city: geoInfo.city,
        region: geoInfo.region,
        source: ipInfo.source,
        isPrivate: ipInfo.isPrivate
    });

    return {
        country: geoInfo.country,
        city: geoInfo.city,
        region: geoInfo.region,
        language,
        userAgent,
        device: userAgentInfo.device,
        os: userAgentInfo.os,
        browser: userAgentInfo.browser,
        referrer
    };
}