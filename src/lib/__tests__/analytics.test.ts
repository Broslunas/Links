import {
    hashIP,
    getClientIP,
    parseUserAgent,
    getBrowserLanguage,
    extractAnalyticsData
} from '../analytics';

// Mock ua-parser-js
jest.mock('ua-parser-js', () => {
    return {
        UAParser: jest.fn().mockImplementation(() => ({
            getResult: jest.fn().mockReturnValue({
                device: { type: 'mobile' },
                os: { name: 'iOS' },
                browser: { name: 'Safari' }
            })
        }))
    };
});

describe('analytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.IP_HASH_SECRET = 'test-secret';
    });

    describe('hashIP', () => {
        it('should hash IP addresses consistently', () => {
            const ip = '192.168.1.1';
            const hash1 = hashIP(ip);
            const hash2 = hashIP(ip);

            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
        });

        it('should produce different hashes for different IPs', () => {
            const hash1 = hashIP('192.168.1.1');
            const hash2 = hashIP('192.168.1.2');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('getClientIP', () => {
        it('should extract IP from x-forwarded-for header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '203.0.113.1, 192.168.1.1'
                }
            });

            expect(getClientIP(request)).toBe('203.0.113.1');
        });

        it('should extract IP from x-real-ip header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-real-ip': '203.0.113.1'
                }
            });

            expect(getClientIP(request)).toBe('203.0.113.1');
        });

        it('should extract IP from cf-connecting-ip header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'cf-connecting-ip': '203.0.113.1'
                }
            });

            expect(getClientIP(request)).toBe('203.0.113.1');
        });

        it('should fallback to localhost for missing headers', () => {
            const request = new Request('http://localhost');
            expect(getClientIP(request)).toBe('127.0.0.1');
        });
    });

    describe('parseUserAgent', () => {
        it('should parse mobile user agent correctly', () => {
            const result = parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

            expect(result.device).toBe('mobile');
            expect(result.os).toBe('iOS');
            expect(result.browser).toBe('Safari');
        });
    });

    describe('getBrowserLanguage', () => {
        it('should extract primary language from Accept-Language header', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'accept-language': 'en-US,en;q=0.9,es;q=0.8'
                }
            });

            expect(getBrowserLanguage(request)).toBe('en-US');
        });

        it('should return en for missing Accept-Language header', () => {
            const request = new Request('http://localhost');
            expect(getBrowserLanguage(request)).toBe('en');
        });
    });

    describe('extractAnalyticsData', () => {
        it('should extract analytics data from request', async () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '127.0.0.1', // Use localhost to avoid geoip lookup
                    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                    'accept-language': 'en-US,en;q=0.9',
                    'referer': 'https://example.com'
                }
            });

            const result = await extractAnalyticsData(request);

            expect(result).toEqual({
                country: 'Unknown', // localhost returns Unknown
                city: 'Unknown',
                region: 'Unknown',
                language: 'en-US',
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                device: 'mobile',
                os: 'iOS',
                browser: 'Safari',
                referrer: 'https://example.com'
            });
        });

        it('should handle missing headers gracefully', async () => {
            const request = new Request('http://localhost');

            const result = await extractAnalyticsData(request);

            expect(result.country).toBe('Unknown');
            expect(result.city).toBe('Unknown');
            expect(result.region).toBe('Unknown');
            expect(result.language).toBe('en');
            expect(result.userAgent).toBe('');
            expect(result.device).toBe('mobile'); // from mocked UAParser
            expect(result.os).toBe('iOS');
            expect(result.browser).toBe('Safari');
            expect(result.referrer).toBeUndefined();
        });
    });
});