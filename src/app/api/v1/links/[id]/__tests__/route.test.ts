/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
    isValidUrl: jest.fn((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }),
}));

jest.mock('../../../../../../models/Link', () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
}));

jest.mock('../../../../../../lib/api-token', () => ({
    validateApiToken: jest.fn(),
    updateTokenLastUsed: jest.fn(),
}));

jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

import { connectDB } from '../../../../../../lib/db-utils';
import Link from '../../../../../../models/Link';
import { validateApiToken, updateTokenLastUsed } from '../../../../../../lib/api-token';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockValidateApiToken = validateApiToken as jest.MockedFunction<typeof validateApiToken>;
const mockUpdateTokenLastUsed = updateTokenLastUsed as jest.MockedFunction<typeof updateTokenLastUsed>;

describe('/api/v1/links/[id]', () => {
    let mockUser: any;
    let mockLink: any;
    let validToken: string;
    let linkId: string;

    beforeEach(() => {
        jest.clearAllMocks();

        linkId = new mongoose.Types.ObjectId().toString();

        mockUser = {
            _id: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            name: 'Test User',
            provider: 'github',
            apiToken: 'hashed_token',
            apiTokenCreatedAt: new Date(),
        };

        mockLink = {
            _id: new mongoose.Types.ObjectId(linkId),
            userId: mockUser._id,
            originalUrl: 'https://example.com',
            slug: 'test-link',
            title: 'Test Link',
            description: 'A test link',
            isPublicStats: false,
            isActive: true,
            clickCount: 10,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            toObject: () => mockLink,
        };

        validToken = 'uls_' + 'a'.repeat(64);

        mockConnectDB.mockResolvedValue(undefined);

        // Mock token validation
        mockValidateApiToken.mockResolvedValue(mockUser);
        mockUpdateTokenLastUsed.mockResolvedValue(undefined);

        // Mock Link.findById for ownership verification
        (Link.findById as jest.Mock).mockResolvedValue(mockLink);
    });

    describe('PUT /api/v1/links/[id]', () => {
        beforeEach(() => {
            // Mock Link.findByIdAndUpdate
            (Link.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockLink);
        });

        it('should update a link with valid data', async () => {
            const updateData = {
                title: 'Updated Title',
                description: 'Updated description',
                isPublicStats: true,
            };

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${linkId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const response = await PUT(request, { params: { id: linkId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                id: linkId,
                title: mockLink.title,
                description: mockLink.description,
                isPublicStats: mockLink.isPublicStats,
            });

            // Verify update was called with correct data
            expect(Link.findByIdAndUpdate).toHaveBeenCalledWith(
                linkId,
                expect.objectContaining({
                    title: updateData.title,
                    description: updateData.description,
                    isPublicStats: updateData.isPublicStats,
                }),
                { new: true, runValidators: true }
            );
        });

        it('should return 401 without valid token', async () => {
            mockValidateApiToken.mockRejectedValue(new Error('Invalid token'));

            const updateData = { title: 'Updated Title' };

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${linkId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const response = await PUT(request, { params: { id: linkId } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should return 400 for invalid link ID format', async () => {
            const invalidId = 'invalid-id';
            const updateData = { title: 'Updated Title' };

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${invalidId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const response = await PUT(request, { params: { id: invalidId } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
            expect(data.error.message).toContain('Invalid link ID format');
        });

        it('should return 404 for non-existent link', async () => {
            // Mock link not found for ownership verification
            (Link.findById as jest.Mock).mockResolvedValue(null);

            const updateData = { title: 'Updated Title' };

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${linkId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const response = await PUT(request, { params: { id: linkId } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('LINK_NOT_FOUND');
        });
    });

    describe('DELETE /api/v1/links/[id]', () => {
        beforeEach(() => {
            // Mock Link.findByIdAndDelete
            (Link.findByIdAndDelete as jest.Mock).mockResolvedValue(mockLink);
        });

        it('should delete a link successfully', async () => {
            const request = new NextRequest(`http://localhost:3000/api/v1/links/${linkId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                },
            });

            const response = await DELETE(request, { params: { id: linkId } });

            expect(response.status).toBe(204);
            expect(Link.findByIdAndDelete).toHaveBeenCalledWith(linkId);
        });

        it('should return 401 without valid token', async () => {
            mockValidateApiToken.mockRejectedValue(new Error('Invalid token'));

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${linkId}`, {
                method: 'DELETE',
            });

            const response = await DELETE(request, { params: { id: linkId } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
        });

        it('should return 400 for invalid link ID format', async () => {
            const invalidId = 'invalid-id';

            const request = new NextRequest(`http://localhost:3000/api/v1/links/${invalidId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${validToken}`,
                },
            });

            const response = await DELETE(request, { params: { id: invalidId } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
            expect(data.error.message).toContain('Invalid link ID format');
        });
    });
});