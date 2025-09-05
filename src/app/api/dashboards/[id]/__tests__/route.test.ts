import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { connectDB } from '../../../../../lib/db-utils';
import Dashboard from '../../../../../models/Dashboard';
import { AuthContext } from '../../../../../lib/auth-middleware';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../../lib/db-utils');
jest.mock('../../../../../models/Dashboard');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockDashboard = Dashboard as jest.MockedClass<typeof Dashboard>;

describe('/api/dashboards/[id]', () => {
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

    describe('GET /api/dashboards/[id]', () => {
        it('should return dashboard for owner', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                name: 'Test Dashboard',
                description: 'Test description',
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
                widgets: [],
                isDefault: true,
                isShared: false,
                sharedWith: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(mockDashboardId);
            expect(data.data.name).toBe('Test Dashboard');
        });

        it('should return dashboard for user with shared access', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                name: 'Shared Dashboard',
                description: 'Shared description',
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
                widgets: [],
                isDefault: false,
                isShared: true,
                sharedWith: [{ userId: mockAuth.userId, permission: 'read', sharedAt: new Date() }],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Shared Dashboard');
        });

        it('should return 404 for non-existent dashboard', async () => {
            MockDashboard.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`);
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
                name: 'Private Dashboard',
                isShared: false,
                sharedWith: [],
            };

            MockDashboard.findById = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockDashboard)
            });

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`);
            const response = await GET(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('FORBIDDEN');
        });

        it('should return 404 for invalid ObjectId format', async () => {
            const invalidParams = { params: { id: 'invalid-id' } };
            const request = new NextRequest('http://localhost:3000/api/dashboards/invalid-id');
            const response = await GET(request, mockAuth, invalidParams);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /api/dashboards/[id]', () => {
        it('should update dashboard successfully', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                name: 'Original Name',
                description: 'Original description',
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
                widgets: [],
                isDefault: false,
                isShared: false,
                sharedWith: [],
            };

            const updatedDashboard = {
                ...mockDashboard,
                name: 'Updated Name',
                description: 'Updated description',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);
            MockDashboard.updateMany = jest.fn().mockResolvedValue({});
            MockDashboard.findByIdAndUpdate = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(updatedDashboard)
            });

            const requestBody = {
                name: 'Updated Name',
                description: 'Updated description'
            };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Updated Name');
        });

        it('should handle setting dashboard as default', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                name: 'Test Dashboard',
                isDefault: false,
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
            };

            const updatedDashboard = {
                ...mockDashboard,
                isDefault: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);
            MockDashboard.updateMany = jest.fn().mockResolvedValue({});
            MockDashboard.findByIdAndUpdate = jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(updatedDashboard)
            });

            const requestBody = { isDefault: true };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await PUT(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(MockDashboard.updateMany).toHaveBeenCalledWith(
                { userId: mockDashboard.userId, isDefault: true, _id: { $ne: mockDashboardId } },
                { $set: { isDefault: false } }
            );
        });

        it('should return 403 for unauthorized update', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'), // Different user
                sharedWith: [], // No shared access
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);

            const requestBody = { name: 'Updated Name' };

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
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
    });

    describe('DELETE /api/dashboards/[id]', () => {
        it('should delete dashboard successfully', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                isDefault: false,
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);
            MockDashboard.findByIdAndDelete = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.message).toBe('Dashboard deleted successfully');
        });

        it('should prevent deletion of only dashboard', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                isDefault: true,
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);
            MockDashboard.countDocuments = jest.fn().mockResolvedValue(1);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
        });

        it('should set another dashboard as default when deleting default', async () => {
            const mockDashboard = {
                _id: new mongoose.Types.ObjectId(mockDashboardId),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                isDefault: true,
            };

            const otherDashboard = {
                _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                isDefault: false,
            };

            MockDashboard.findById = jest.fn().mockResolvedValue(mockDashboard);
            MockDashboard.countDocuments = jest.fn().mockResolvedValue(2);
            MockDashboard.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockResolvedValue(otherDashboard)
            });
            MockDashboard.findByIdAndUpdate = jest.fn().mockResolvedValue(otherDashboard);
            MockDashboard.findByIdAndDelete = jest.fn().mockResolvedValue(mockDashboard);

            const request = new NextRequest(`http://localhost:3000/api/dashboards/${mockDashboardId}`, {
                method: 'DELETE'
            });

            const response = await DELETE(request, mockAuth, mockParams);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(MockDashboard.findByIdAndUpdate).toHaveBeenCalledWith(
                otherDashboard._id,
                { isDefault: true }
            );
        });
    });
});