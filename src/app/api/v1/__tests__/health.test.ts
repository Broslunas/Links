import { ApiV1Response, LinkV1Response, CreateLinkV1Request } from '../../../../types/api-v1';

describe('API v1 Types', () => {
    it('should have correct ApiV1Response type structure', () => {
        const mockResponse: ApiV1Response<{ status: string }> = {
            success: true,
            data: { status: 'healthy' },
            timestamp: new Date().toISOString()
        };

        expect(mockResponse.success).toBe(true);
        expect(mockResponse.data?.status).toBe('healthy');
        expect(mockResponse.timestamp).toBeDefined();
    });

    it('should have correct LinkV1Response type structure', () => {
        const mockLink: LinkV1Response = {
            id: '123',
            originalUrl: 'https://example.com',
            slug: 'test-slug',
            shortUrl: 'https://short.ly/test-slug',
            isPublicStats: false,
            isActive: true,
            clickCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        expect(mockLink.id).toBe('123');
        expect(mockLink.originalUrl).toBe('https://example.com');
        expect(mockLink.slug).toBe('test-slug');
    });

    it('should have correct CreateLinkV1Request type structure', () => {
        const mockRequest: CreateLinkV1Request = {
            originalUrl: 'https://example.com',
            slug: 'custom-slug',
            title: 'Test Link',
            isPublicStats: true
        };

        expect(mockRequest.originalUrl).toBe('https://example.com');
        expect(mockRequest.slug).toBe('custom-slug');
        expect(mockRequest.title).toBe('Test Link');
        expect(mockRequest.isPublicStats).toBe(true);
    });
});