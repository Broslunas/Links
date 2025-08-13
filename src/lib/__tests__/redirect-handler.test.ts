import { handleRedirect, isValidSlug } from '../redirect-handler';
import { connectDB } from '../db-utils';
import Link from '../../models/Link';
import AnalyticsEvent from '../../models/AnalyticsEvent';

// Mock the database connection and models
jest.mock('../db-utils');
jest.mock('../../models/Link');
jest.mock('../../models/AnalyticsEvent');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockLink = Link as jest.Mocked<typeof Link>;
const mockAnalyticsEvent = AnalyticsEvent as any;

describe('redirect-handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isValidSlug', () => {
        it('should return true for valid slugs', () => {
            expect(isValidSlug('test')).toBe(true);
            expect(isValidSlug('test-123')).toBe(true);
            expect(isValidSlug('test_slug')).toBe(true);
            expect(isValidSlug('123abc')).toBe(true);
        });

        it('should return false for invalid slugs', () => {
            expect(isValidSlug('')).toBe(false);
            expect(isValidSlug('TEST')).toBe(false); // uppercase
            expect(isValidSlug('test slug')).toBe(false); // space
            expect(isValidSlug('test@slug')).toBe(false); // special char
            expect(isValidSlug('a'.repeat(51))).toBe(false); // too long
            expect(isValidSlug(null as any)).toBe(false);
            expect(isValidSlug(undefined as any)).toBe(false);
        });
    });

    describe('handleRedirect', () => {
        const mockRequest = new Request('http://localhost', {
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'accept-language': 'en-US,en;q=0.9',
                'x-forwarded-for': '192.168.1.1'
            }
        });

        it('should successfully redirect for valid active link', async () => {
            const mockLinkDoc = {
                _id: 'link123',
                originalUrl: 'https://example.com',
                slug: 'test',
                isActive: true
            };

            (mockConnectDB as any).mockResolvedValue({});
            mockLink.findOne.mockResolvedValue(mockLinkDoc);
            mockLink.findByIdAndUpdate.mockResolvedValue(mockLinkDoc);

            const mockAnalyticsEventInstance = {
                save: jest.fn().mockResolvedValue(undefined)
            };
            mockAnalyticsEvent.mockImplementation(() => mockAnalyticsEventInstance);

            const result = await handleRedirect('test', mockRequest);

            expect(result.success).toBe(true);
            expect(result.originalUrl).toBe('https://example.com');
            expect(mockLink.findOne).toHaveBeenCalledWith({
                slug: 'test',
                isActive: true
            });
        });

        it('should return error for non-existent link', async () => {
            (mockConnectDB as any).mockResolvedValue({});
            mockLink.findOne.mockResolvedValue(null);

            const result = await handleRedirect('nonexistent', mockRequest);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Link not found or inactive');
        });

        it('should return error for inactive link', async () => {
            const mockLinkDoc = {
                _id: 'link123',
                originalUrl: 'https://example.com',
                slug: 'test',
                isActive: false
            };

            (mockConnectDB as any).mockResolvedValue({});
            mockLink.findOne.mockResolvedValue(null); // findOne with isActive: true returns null

            const result = await handleRedirect('test', mockRequest);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Link not found or inactive');
        });

        it('should handle database errors gracefully', async () => {
            (mockConnectDB as any).mockRejectedValue(new Error('Database connection failed'));

            const result = await handleRedirect('test', mockRequest);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Internal server error');
        });

        it('should continue redirect even if analytics fails', async () => {
            const mockLinkDoc = {
                _id: 'link123',
                originalUrl: 'https://example.com',
                slug: 'test',
                isActive: true
            };

            (mockConnectDB as any).mockResolvedValue({});
            mockLink.findOne.mockResolvedValue(mockLinkDoc);
            mockLink.findByIdAndUpdate.mockResolvedValue(mockLinkDoc);

            const mockAnalyticsEventInstance = {
                save: jest.fn().mockRejectedValue(new Error('Analytics failed'))
            };
            mockAnalyticsEvent.mockImplementation(() => mockAnalyticsEventInstance);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await handleRedirect('test', mockRequest);

            expect(result.success).toBe(true);
            expect(result.originalUrl).toBe('https://example.com');
            expect(consoleSpy).toHaveBeenCalledWith('Error recording analytics:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });
});