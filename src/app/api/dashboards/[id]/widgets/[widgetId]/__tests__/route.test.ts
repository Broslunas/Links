import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { connectDB } from '../../../../../../../lib/db-utils';
import Dashboard from '../../../../../../../models/Dashboard';
import { AuthContext } from '../../../../../../../lib/auth-middleware';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../../../lib/db-utils');
jest.mock('../../../../../../../models/Dashboard');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockDashboard = Dashboard as jest.MockedClass<typeof Dashboard>;

describe('/api/dashboards/[id]/widgets/[widgetId]', () => {
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
    const mockWidgetId = 'widget-123';
    const mockParams = { params: { id: mockDashboardId, widgetId: mockWidgetId } };

    const mockWidget = {
        id: mockWidgetId,
        type: 'link-stats',
        position: { x: 0, y: 0 },
        size: { width: 4, height: 2 },
        config: { title: 'Test Widget', showHeader: true },
        filters: []
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined);
    });

    describe('GET /api/dashboards/[id]/widgets/[widgetId]', () => {
        it('should return specific widget for dashboard owner', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [mockWidget],
                sharedWith: []
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockWidget);
        });

        it('should return specific widget for user with shared access', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [{ userId: mockAuth.userId, permission: 'read' }]
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockWidget);
        });

        it('should return 404 for non-existent widget', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [], // No widgets
                sharedWith: []
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });

        it('should return 403 for unauthorized access', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [] // No shared access
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('FORBIDDEN');
        });
    });

    describe('PUT /api/dashboards/[id]/widgets/[widgetId]', () => {
        it('should update widget successfully', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [mockWidget],
                sharedWith: [],
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                position: { x: 2, y: 2 },
                config: { title: 'Updated Widget', showHeader: false }
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.position).toEqual({ x: 2, y: 2 });
            expect(data.data.config.title).toBe('Updated Widget');
            expect(data.data.config.showHeader).toBe(false);
            expect(mockDashboard.save).toHaveBeenCalled();
        });

        it('should update widget with write access', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [{ userId: mockAuth.userId, permission: 'write' }],
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                size: { width: 6, height: 3 }
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.size).toEqual({ width: 6, height: 3 });
        });

        it('should prevent widget overlap on update', async () => {
            const otherWidget = {
                id: 'other-widget',
                type: 'link-list',
                position: { x: 4, y: 0 },
                size: { width: 4, height: 2 },
                config: { showHeader: true },
                filters: []
            };

            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [mockWidget, otherWidget],
                sharedWith: [],
                save: jest.fn()
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                position: { x: 5, y: 1 }, // Would overlap with otherWidget
                size: { width: 4, height: 2 }
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
            expect(data.error.message).toContain('overlap');
        });

        it('should return 403 for unauthorized update', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [{ userId: mockAuth.userId, permission: 'read' }] // Only read access
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                position: { x: 2, y: 2 }
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('FORBIDDEN');
        });

        it('should return 404 for non-existent widget', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [], // No widgets
                sharedWith: []
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = {
                position: { x: 2, y: 2 }
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });
    });

    describe('DELETE /api/dashboards/[id]/widgets/[widgetId]', () => {
        it('should delete widget successfully', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [mockWidget],
                sharedWith: [],
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.message).toBe('Widget deleted successfully');
            expect(mockDashboard.save).toHaveBeenCalled();
            expect(mockDashboard.widgets).toHaveLength(0);
        });

        it('should delete widget with write access', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [{ userId: mockAuth.userId, permission: 'write' }],
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.message).toBe('Widget deleted successfully');
        });

        it('should return 403 for unauthorized deletion', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                widgets: [mockWidget],
                sharedWith: [{ userId: mockAuth.userId, permission: 'read' }] // Only read access
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('FORBIDDEN');
        });

        it('should return 404 for non-existent widget', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                widgets: [], // No widgets
                sharedWith: []
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}/widgets/${mockWidgetId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });
    });
});