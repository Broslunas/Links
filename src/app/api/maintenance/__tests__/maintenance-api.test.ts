/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { GET as statusHandler } from '../status/route';
import { POST as toggleHandler } from '../toggle/route';
import MaintenanceState from '@/models/MaintenanceState';
import User from '@/models/User';

// Mock next-auth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));

// Mock the auth options
jest.mock('@/lib/auth-simple', () => ({
    authOptions: {},
}));

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
});

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Maintenance API Endpoints', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        try {
            mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
        } catch (error) {
            console.warn('MongoDB Memory Server failed to start, skipping database tests');
        }
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        if (mongoose.connection.readyState === 1) {
            await MaintenanceState.deleteMany({});
            await User.deleteMany({});
        }
        jest.clearAllMocks();
    });

    // Helper function to create mock NextRequest
    function createMockRequest(url: string, options: {
        method?: string;
        headers?: Record<string, string>;
        body?: any;
    } = {}) {
        const { method = 'GET', headers = {}, body } = options;
        return new NextRequest(url, {
            method,
            headers: new Headers(headers),
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    describe('GET /api/maintenance/status', () => {
        it('should return maintenance status when state exists', async () => {
            // Create maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance in progress',
                estimatedDuration: 60,
            });
            await maintenanceState.save();

            const request = createMockRequest('http://localhost:3000/api/maintenance/status');
            const response = await statusHandler(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                isActive: true,
                message: 'System maintenance in progress',
                estimatedDuration: 60,
            });
        });

        it('should create default state and return it when no state exists', async () => {
            const request = createMockRequest('http://localhost:3000/api/maintenance/status');
            const response = await statusHandler(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                isActive: false,
                message: undefined,
                estimatedDuration: undefined,
            });

            // Verify state was created in database
            const createdState = await MaintenanceState.findOne();
            expect(createdState).toBeTruthy();
            expect(createdState!.isActive).toBe(false);
            expect(createdState!.activatedBy).toBe('system@default.com');
        });

        it('should return fallback response when database connection fails', async () => {
            // Disconnect from database to simulate connection failure
            await mongoose.disconnect();

            const request = createMockRequest('http://localhost:3000/api/maintenance/status');
            const response = await statusHandler(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                isActive: false,
                message: null,
                estimatedDuration: null,
                error: 'Unable to check maintenance status - defaulting to normal operation',
                fallback: true,
            });

            // Reconnect for other tests
            if (mongoServer) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });

        it('should handle request headers correctly', async () => {
            const request = createMockRequest('http://localhost:3000/api/maintenance/status', {
                headers: {
                    'user-agent': 'test-agent',
                    'x-forwarded-for': '192.168.1.1',
                },
            });

            const response = await statusHandler(request);
            expect(response.status).toBe(200);
        });
    });

    describe('POST /api/maintenance/toggle', () => {
        let adminUser: any;

        beforeEach(async () => {
            // Create admin user
            adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();
        });

        describe('Authentication and Authorization', () => {
            it('should return 401 when user is not authenticated', async () => {
                mockGetServerSession.mockResolvedValue(null);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(401);
                expect(data).toEqual({
                    success: false,
                    error: 'Authentication required',
                });
            });

            it('should return 401 when session has no user email', async () => {
                mockGetServerSession.mockResolvedValue({
                    user: {},
                } as any);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(401);
                expect(data).toEqual({
                    success: false,
                    error: 'Authentication required',
                });
            });

            it('should return 403 when user is not admin', async () => {
                // Create regular user
                const regularUser = new User({
                    email: 'user@example.com',
                    name: 'Regular User',
                    provider: 'github',
                    providerId: 'github456',
                    role: 'user',
                });
                await regularUser.save();

                mockGetServerSession.mockResolvedValue({
                    user: { email: 'user@example.com', name: 'Regular User' },
                } as any);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(403);
                expect(data).toEqual({
                    success: false,
                    error: 'Admin access required',
                });
            });

            it('should return 403 when user does not exist', async () => {
                mockGetServerSession.mockResolvedValue({
                    user: { email: 'nonexistent@example.com', name: 'Non-existent User' },
                } as any);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(403);
                expect(data).toEqual({
                    success: false,
                    error: 'Admin access required',
                });
            });

            it('should allow admin user to toggle maintenance mode', async () => {
                mockGetServerSession.mockResolvedValue({
                    user: { email: 'admin@example.com', name: 'Admin User' },
                } as any);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data.isActive).toBe(true);
                expect(data.data.activatedBy).toBe('admin@example.com');
            });
        });

        describe('Input Validation and Error Responses', () => {
            beforeEach(() => {
                mockGetServerSession.mockResolvedValue({
                    user: { email: 'admin@example.com', name: 'Admin User' },
                } as any);
            });

            it('should return 400 for invalid JSON', async () => {
                const request = new NextRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: 'invalid json',
                    headers: { 'content-type': 'application/json' },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Invalid JSON in request body',
                });
            });

            it('should return 400 when isActive is missing', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { message: 'test' },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'isActive field is required and must be a boolean',
                });
            });

            it('should return 400 when isActive is not boolean', async () => {
                const invalidValues = ['true', 1, 0, null, undefined, {}];

                for (const value of invalidValues) {
                    const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                        method: 'POST',
                        body: { isActive: value },
                    });

                    const response = await toggleHandler(request);
                    const data = await response.json();

                    expect(response.status).toBe(400);
                    expect(data).toEqual({
                        success: false,
                        error: 'isActive field is required and must be a boolean',
                    });
                }
            });

            it('should return 400 when message is not string', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, message: 123 },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Message must be a string',
                });
            });

            it('should return 400 when message exceeds 500 characters', async () => {
                const longMessage = 'a'.repeat(501);

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, message: longMessage },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Message cannot exceed 500 characters',
                });
            });

            it('should return 400 when message contains script tags', async () => {
                const maliciousMessage = 'Hello <script>alert("xss")</script> world';

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, message: maliciousMessage },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Message contains invalid content',
                });
            });

            it('should return 400 when estimatedDuration is not number', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, estimatedDuration: 'not-a-number' },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Estimated duration must be a positive number (max 10080 minutes)',
                });
            });

            it('should return 400 when estimatedDuration is negative', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, estimatedDuration: -1 },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Estimated duration must be a positive number (max 10080 minutes)',
                });
            });

            it('should return 400 when estimatedDuration exceeds maximum', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, estimatedDuration: 10081 },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data).toEqual({
                    success: false,
                    error: 'Estimated duration must be a positive number (max 10080 minutes)',
                });
            });

            it('should accept valid input values', async () => {
                const validInputs = [
                    { isActive: true },
                    { isActive: false },
                    { isActive: true, message: 'Valid message' },
                    { isActive: true, estimatedDuration: 60 },
                    { isActive: true, message: 'Valid message', estimatedDuration: 120 },
                    { isActive: true, estimatedDuration: 0 }, // Zero is valid
                    { isActive: true, estimatedDuration: 10080 }, // Max value
                ];

                for (const input of validInputs) {
                    // Clear existing state
                    await MaintenanceState.deleteMany({});

                    const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                        method: 'POST',
                        body: input,
                    });

                    const response = await toggleHandler(request);
                    const data = await response.json();

                    expect(response.status).toBe(200);
                    expect(data.success).toBe(true);
                    expect(data.data.isActive).toBe(input.isActive);
                }
            });
        });

        describe('State Toggle Functionality', () => {
            beforeEach(() => {
                mockGetServerSession.mockResolvedValue({
                    user: { email: 'admin@example.com', name: 'Admin User' },
                } as any);
            });

            it('should create new maintenance state when none exists', async () => {
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: {
                        isActive: true,
                        message: 'System maintenance',
                        estimatedDuration: 60,
                    },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toMatchObject({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    message: 'System maintenance',
                    estimatedDuration: 60,
                });
                expect(data.data.activatedAt).toBeDefined();
                expect(data.data.updatedAt).toBeDefined();

                // Verify state was saved to database
                const savedState = await MaintenanceState.findOne();
                expect(savedState).toBeTruthy();
                expect(savedState!.isActive).toBe(true);
            });

            it('should update existing maintenance state', async () => {
                // Create initial state
                const initialState = new MaintenanceState({
                    isActive: false,
                    activatedBy: 'previous@example.com',
                    activatedAt: new Date(),
                    message: 'Previous message',
                });
                await initialState.save();

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: {
                        isActive: true,
                        message: 'Updated message',
                        estimatedDuration: 90,
                    },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toMatchObject({
                    isActive: true,
                    activatedBy: 'admin@example.com',
                    message: 'Updated message',
                    estimatedDuration: 90,
                });

                // Verify only one document exists
                const count = await MaintenanceState.countDocuments();
                expect(count).toBe(1);
            });

            it('should handle partial updates correctly', async () => {
                // Create initial state with all fields
                const initialState = new MaintenanceState({
                    isActive: false,
                    activatedBy: 'admin@example.com',
                    activatedAt: new Date(),
                    message: 'Initial message',
                    estimatedDuration: 30,
                });
                await initialState.save();

                // Update only isActive
                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data.isActive).toBe(true);
                expect(data.data.activatedBy).toBe('admin@example.com');
                // Previous values should be preserved
                expect(data.data.message).toBe('Initial message');
                expect(data.data.estimatedDuration).toBe(30);
            });

            it('should update activatedAt timestamp on every toggle', async () => {
                const beforeToggle = new Date();

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                const afterToggle = new Date();

                expect(response.status).toBe(200);
                const activatedAt = new Date(data.data.activatedAt);
                expect(activatedAt.getTime()).toBeGreaterThanOrEqual(beforeToggle.getTime());
                expect(activatedAt.getTime()).toBeLessThanOrEqual(afterToggle.getTime());
            });

            it('should handle activation and deactivation correctly', async () => {
                // Test activation
                let request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, message: 'Maintenance active' },
                });

                let response = await toggleHandler(request);
                let data = await response.json();

                expect(response.status).toBe(200);
                expect(data.data.isActive).toBe(true);
                expect(data.data.message).toBe('Maintenance active');

                // Test deactivation
                request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: false, message: 'Maintenance completed' },
                });

                response = await toggleHandler(request);
                data = await response.json();

                expect(response.status).toBe(200);
                expect(data.data.isActive).toBe(false);
                expect(data.data.message).toBe('Maintenance completed');
            });
        });

        describe('Error Handling', () => {
            beforeEach(() => {
                mockGetServerSession.mockResolvedValue({
                    user: { email: 'admin@example.com', name: 'Admin User' },
                } as any);
            });

            it('should handle database connection errors gracefully', async () => {
                // Disconnect from database to simulate connection failure
                await mongoose.disconnect();

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(503);
                expect(data).toEqual({
                    success: false,
                    error: 'Database connection error - please try again later',
                });

                // Reconnect for other tests
                if (mongoServer) {
                    const mongoUri = mongoServer.getUri();
                    await mongoose.connect(mongoUri);
                }
            });

            it('should handle session timeout errors', async () => {
                // Mock session timeout
                mockGetServerSession.mockRejectedValue(new Error('Session verification timeout'));

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true },
                });

                const response = await toggleHandler(request);
                const data = await response.json();

                expect(response.status).toBe(408);
                expect(data).toEqual({
                    success: false,
                    error: 'Request timeout - please try again',
                });
            });

            it('should log audit information for successful toggles', async () => {
                const consoleSpy = jest.spyOn(console, 'log');

                const request = createMockRequest('http://localhost:3000/api/maintenance/toggle', {
                    method: 'POST',
                    body: { isActive: true, message: 'Test maintenance' },
                    headers: {
                        'x-forwarded-for': '192.168.1.1',
                        'user-agent': 'test-agent',
                    },
                });

                const response = await toggleHandler(request);
                expect(response.status).toBe(200);

                // Verify audit logging
                expect(consoleSpy).toHaveBeenCalledWith(
                    'Maintenance mode activated successfully',
                    expect.objectContaining({
                        adminEmail: 'admin@example.com',
                        adminName: 'Admin User',
                        isActive: true,
                        message: 'Test maintenance',
                        ip: '192.168.1.1',
                        userAgent: 'test-agent',
                    })
                );

                consoleSpy.mockRestore();
            });
        });
    });
});