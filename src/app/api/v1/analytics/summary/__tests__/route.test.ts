/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../../lib/db-utils', () => ({
    connectDB: jest.fn(),
}));

jest.mock('../../../../../../models/User');
jest.mock('../../../../../../models/Link');
jest.mock('../../../../../../models/AnalyticsEvent');
jest.mock('../../../../../../lib/api-token');

import { connectDB } from '../../../../../../lib/db-utils';
import User from '../../../../../../models/User';
import Link from '../../../../../../models/Link';
import AnalyticsEvent from '../../../../../../models/AnalyticsEvent';
import { validateApiToken, updateTokenLastUsed } from '../../../../../../lib/api-token';

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockValidateApiToken = validateApiToken as jest.MockedFunction<typeof validateApiToken>;
const mockUpdateTokenLastUsed = updateTokenLastUsed as jest.MockedFunction<typeof updateTokenLastUsed>;

describe('/api/v1/analytics/summary - GET', () => {
    let testUser: any;
    let testLinks: any[];
    let validToken: string;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined);

        testUser = {
            _id: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            name: 'Test User',
            provider: 'github',
            apiToken: 'hashed_token',
        };

        testLinks = [
            {
                _id: new mongoose.Types.ObjectId(),
                userId: testUser._id,
                slug: 'test-link-1',
                title: 'Test Link 1',
                isActive: true,
            },
            {
                _id: new mongoose.Types.ObjectId(),
                userId: testUser._id,
                slug: 'test-link-2',
                title: 'Test Link 2',
                isActive: true,
            }
        ];

        validToken = 'uls_' + 'a'.repeat(64);

        mockValidateApiToken.mockResolvedValue(testUser);
        mockUpdateTokenLastUsed.mockResolvedValue(undefined);
        (Link.find as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(testLinks)
        });
    });

    it('should return summary analytics successfully', async () => {
        (AnalyticsEvent.countDocuments as jest.Mock).mockResolvedValue(50);
        (AnalyticsEvent.distinct as jest.Mock).mockResolvedValue(['ip1', 'ip2', 'ip3']);
        (AnalyticsEvent.aggregate as jest.Mock).mockResolvedValue([
            { id: testLinks[0]._id.toString(), slug: 'test-link-1', title: 'Test Link 1', clicks: 10 }
        ]);

        const request = new NextRequest('http://localhost:3000/api/v1/analytics/summary', {
            headers: { Authorization: `Bearer ${validToken}` }
        });
        const response = await GET(request, {});

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('totalLinks', 2);
        expect(data.data).toHaveProperty('totalClicks', 50);
    });

    it('should return empty summary when user has no links', async () => {
        (Link.find as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue([])
        });

        const request = new NextRequest('http://localhost:3000/api/v1/analytics/summary', {
            headers: { Authorization: `Bearer ${validToken}` }
        });
        const response = await GET(request, {});

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data.totalLinks).toBe(0);
        expect(data.data.totalClicks).toBe(0);
    });
});