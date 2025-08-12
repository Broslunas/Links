/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';

// Mock NextAuth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

// Mock database connection
jest.mock('../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
    generateSlug: jest.fn(() => 'test123'),
    isValidUrl: jest.fn((url: string) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }),
}));

// Mock Link model
jest.mock('../../../../models/Link', () => ({
    findOne: jest.fn(),
    prototype: {
        save: jest.fn(),
    },
}));

import { getServerSession } from 'next-auth';
import Link from '../../../../models/Link';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockLinkFindOne = Link.findOne as jest.MockedFunction<typeof Link.findOne>;

describe('/api/links POST', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/links', {
            method: 'POST',
            body: JSON.stringify({ originalUrl: 'https://example.com' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if originalUrl is missing', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
        } as any);

        const request = new NextRequest('http://localhost:3000/api/links', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if URL is invalid', async () => {
        mockGetServerSession.mockResolvedValue({
            user: { id: 'user123', email: 'test@example.com' },
        } as any);

        const request = new NextRequest('http://localhost:3000/api/links', {
            method: 'POST',
            body: JSON.stringify({ originalUrl: 'not-a-valid-url' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error.code).toBe('VALIDATION_ERROR');
    });
});