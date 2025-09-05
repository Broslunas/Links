import { NextRequest } from 'next/server';
import { connectDB } from '../../../../lib/db-utils';
import Dashboard from '../../../../models/Dashboard';
import { AuthContext } from '../../../../lib/auth-middleware';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../../../../lib/db-utils');
jest.mock('../../../../models/Dashboard');
jest.mock('../../../../lib/auth-middleware');

// Import the route handlers after mocking
const { GET, POST } = require('../route');

const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const MockDashboard = Dashboard as jest.MockedClass<typeof Dashboard>;

describe('/api/dashboards', () => {
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

    beforeEach(() => {
        jest.clearAllMocks();
        mockConnectDB.mockResolvedValue(undefined);
    });

    describe('GET /api/dashboards', () => {
        it('should return user dashboards successfully', async () => {
            const mockDashboards = [
                {
                    _id: new mongoose.Types.ObjectId(),
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
                }
            ];

            MockDashboard.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockDashboards)
                })
            });

            const request = new NextRequest('http://localhost:3000/api/dashboards');
            const response = await GET(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
            expect(data.data[0].name).toBe('Test Dashboard');
            expect(MockDashboard.find).toHaveBeenCalledWith({ userId: mockAuth.userId });
        });

        it('should handle database errors', async () => {
            MockDashboard.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error('Database error'))
                })
            });

            const request = new NextRequest('http://localhost:3000/api/dashboards');
            const response = await GET(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('DATABASE_ERROR');
        });
    });

    describe('POST /api/dashboards', () => {
        it('should create a new dashboard successfully', async () => {
            const mockSavedDashboard = {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                name: 'New Dashboard',
                description: 'New description',
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
                widgets: [],
                isDefault: false,
                isShared: false,
                sharedWith: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.updateMany = jest.fn().mockResolvedValue({});
            MockDashboard.mockImplementation(() => mockSavedDashboard);

            const requestBody = {
                name: 'New Dashboard',
                description: 'New description',
                isDefault: false
            };

            const request = new NextRequest('http://localhost:3000/api/dashboards', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('New Dashboard');
            expect(mockSavedDashboard.save).toHaveBeenCalled();
        });

        it('should handle default dashboard creation', async () => {
            const mockSavedDashboard = {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(mockAuth.userId),
                name: 'Default Dashboard',
                description: undefined,
                layout: { columns: 12, rows: 20, gap: 16, responsive: true },
                widgets: [],
                isDefault: true,
                isShared: false,
                sharedWith: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            MockDashboard.updateMany = jest.fn().mockResolvedValue({});
            MockDashboard.mockImplementation(() => mockSavedDashboard);

            const requestBody = {
                name: 'Default Dashboard',
                isDefault: true
            };

            const request = new NextRequest('http://localhost:3000/api/dashboards', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.isDefault).toBe(true);
            expect(MockDashboard.updateMany).toHaveBeenCalledWith(
                { userId: mockAuth.userId, isDefault: true },
                { $set: { isDefault: false } }
            );
        });

        it('should validate required fields', async () => {
            const requestBody = {
                description: 'Missing name'
            };

            const request = new NextRequest('http://localhost:3000/api/dashboards', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
        });

        it('should handle invalid JSON', async () => {
            const request = new NextRequest('http://localhost:3000/api/dashboards', {
                method: 'POST',
                body: 'invalid json',
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('VALIDATION_ERROR');
        });

        it('should handle database save errors', async () => {
            const mockDashboard = {
                save: jest.fn().mockRejectedValue(new Error('Save failed'))
            };

            MockDashboard.updateMany = jest.fn().mockResolvedValue({});
            MockDashboard.mockImplementation(() => mockDashboard);

            const requestBody = {
                name: 'Test Dashboard'
            };

            const request = new NextRequest('http://localhost:3000/api/dashboards', {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: { 'Content-Type': 'application/json' }
            });

            const response = await POST(request, mockAuth);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.error.code).toBe('DATABASE_ERROR');
        });
    });
});