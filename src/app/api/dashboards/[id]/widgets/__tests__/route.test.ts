import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { connectDB } from '../../../../../../lib/db-utils';
import Dashboard from '../../../../../../models/Dashboard';
import { AuthContext } from '../../../../../../lib/auth-middleware';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../../lib/db-utils');
jest.mock('../../../../../../models/Dashboard');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockDashboard = Dashboard as jest.MockedClass<typeof Dashboard>;

describe('/api/dashboards/[id]/widgets', () => {
    const mockAuth: AuthContext = {
        userId: '507f1f77bcf86cd799439011',
        user: {
            id: '507f1f77bcf86cd799439011',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user'
        },
        authMethod: 'session'
    };

    const mockDashboardId = '507f1f77bcf86cd799439012';
    const mockParams = { params: { id: mockDashboardId } };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined);
    });

    describe('GET /api/dashboards/[id]/widgets', () => {
        it('should return widgets for dashboard owner', async () => {
            const mockWidgets = [
                {
                    id: 'widget-1',
                    type: 'link-stats',
                    position: { x: 0, y: 0 },
                    size: { width: 4, height: 2 },
                    config: { title: 'Stats Widget', showHeader: true },
                    filters: []
                }
            ];

            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: mockWidgets,
                sharedWith: []
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockWidgets);
        });

        it('should return 404 for non-existent dashboard', async () => {
            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });
    });

    describe('POST /api/dashboards/[id]/widgets', () => {
        it('should add widget to dashboard successfully', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [],
                sharedWith: [],
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                type: 'link-stats',
                position: { x: 0, y: 0 },
                size: { width: 4, height: 2 },
                config: { title: 'New Widget' },
                filters: []
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets`, {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.type).toBe('link-stats');
            expect(data.data.position).toEqual({ x: 0, y: 0 });
            expect(data.data.size).toEqual({ width: 4, height: 2 });
            expect(mockDashboard.save).toHaveBeenCalled();
        });
    });
});