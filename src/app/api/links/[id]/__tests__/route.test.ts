import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { GET, PUT, DELETE } from '../route';
import { connectDB } from '../../../../../lib/db-utils';
import Link from '../../../../../models/Link';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../../../lib/db-utils');
jest.mock('../../../../../models/Link');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockLink = Link as jest.Mocked<typeof Link>;

// Mock the isValidUrl function
const mockDbUtils = require('../../../../../lib/db-utils');
mockDbUtils.isValidUrl = jest.fn().mockReturnValue(true);

describe('/api/links/[id] API Routes', () => {
    const mockSession = {
        user: {
            id: 'user123',
            email: 'test@example.com',
            name: 'Test User',
        },
    };

    const mockLink1 = {
        _id: new mongoose.Types.ObjectId(),
        userId: 'user123',
        originalUrl: 'https://example.com',
        slug: 'test-slug',
        title: 'Test Link',
        description: 'Test description',
        isPublicStats: false,
        isActive: true,
        clickCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined as any);
    });

    describe('GET /api/links/[id]', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/links/123');
            const response = await GET(request, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 400 for invalid ObjectId', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost/api/links/invalid-id');
            const response = await GET(request, { params: { id: 'invalid-id' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_ID');
        });

        it('should return 404 if link not found', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(null),
            } as any);

            const validId = new mongoose.Types.ObjectId().toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`);
            const response = await GET(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return link successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOne.mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockLink1),
            } as any);

            const validId = mockLink1._id.toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`);
            const response = await GET(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.slug).toBe('test-slug');
            expect(data.data.shortUrl).toContain('/test-slug');
        });
    });

    describe('PUT /api/links/[id]', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/links/123', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl: 'https://updated.com' }),
            });
            const response = await PUT(request, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 400 for invalid ObjectId', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost/api/links/invalid-id', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl: 'https://updated.com' }),
            });
            const response = await PUT(request, { params: { id: 'invalid-id' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_ID');
        });

        it('should return 404 if link not found', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOne.mockResolvedValue(null);

            const validId = new mongoose.Types.ObjectId().toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl: 'https://updated.com' }),
            });
            const response = await PUT(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should update link successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOne.mockResolvedValue(mockLink1);

            const updatedLink = { ...mockLink1, originalUrl: 'https://updated.com' };
            mockLink.findByIdAndUpdate.mockReturnValue({
                lean: jest.fn().mockResolvedValue(updatedLink),
            } as any);

            const validId = mockLink1._id.toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ originalUrl: 'https://updated.com' }),
            });
            const response = await PUT(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.originalUrl).toBe('https://updated.com');
        });

        it('should return 409 for duplicate slug', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOne
                .mockResolvedValueOnce(mockLink1) // First call - existing link
                .mockResolvedValueOnce({ slug: 'existing-slug' }); // Second call - slug exists

            const validId = mockLink1._id.toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ slug: 'existing-slug' }),
            });
            const response = await PUT(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('SLUG_EXISTS');
        });
    });

    describe('DELETE /api/links/[id]', () => {
        it('should return 401 if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/links/123', {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: { id: '123' } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 400 for invalid ObjectId', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);

            const request = new NextRequest('http://localhost/api/links/invalid-id', {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: { id: 'invalid-id' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('INVALID_ID');
        });

        it('should return 404 if link not found', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOneAndDelete.mockResolvedValue(null);

            const validId = new mongoose.Types.ObjectId().toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`, {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should delete link successfully', async () => {
            mockGetServerSession.mockResolvedValue(mockSession);
            mockLink.findOneAndDelete.mockResolvedValue(mockLink1);

            const validId = mockLink1._id.toString();
            const request = new NextRequest(`http://localhost/api/links/${validId}`, {
                method: 'DELETE',
            });
            const response = await DELETE(request, { params: { id: validId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.deletedId).toBe(validId);
        });
    });
});