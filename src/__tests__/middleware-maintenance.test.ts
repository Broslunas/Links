/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { middleware } from '../../middleware';
import MaintenanceState from '@/models/MaintenanceState';
import User from '@/models/User';

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
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

const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

describe('Middleware Maintenance Logic', () => {
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

        // Clear maintenance cache by setting a mock environment
        process.env.NEXTAUTH_SECRET = 'test-secret';
    });

    // Helper function to create mock NextRequest
    function createMockRequest(url: string, options: {
        method?: string;
        headers?: Record<string, string>;
    } = {}) {
        const { method = 'GET', headers = {} } = options;
        return new NextRequest(url, {
            method,
            headers: new Headers(headers),
        });
    }

    describe('Maintenance Status Checking', () => {
        it('should allow access when maintenance is inactive', async () => {
            // Create inactive maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response).toBeInstanceOf(NextResponse);
            // Should continue to next middleware/handler
            expect(response.status).not.toBe(307); // Not a redirect
        });

        it('should redirect non-admin users when maintenance is active', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance in progress',
            });
            await maintenanceState.save();

            // Create regular user
            const regularUser = new User({
                email: 'user@example.com',
                name: 'Regular User',
                provider: 'github',
                providerId: 'github123',
                role: 'user',
            });
            await regularUser.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });

        it('should allow admin users when maintenance is active', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance in progress',
            });
            await maintenanceState.save();

            // Create admin user
            const adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response.status).not.toBe(307); // Not a redirect
        });

        it('should redirect unauthenticated users when maintenance is active', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue(null);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response.status).toBe(307); // Redirect status
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });

        it('should create default maintenance state when none exists', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            // Should not redirect since default state is inactive
            expect(response.status).not.toBe(307);

            // Verify default state was created
            const createdState = await MaintenanceState.findOne();
            expect(createdState).toBeTruthy();
            expect(createdState!.isActive).toBe(false);
            expect(createdState!.activatedBy).toBe('system@default.com');
        });
    });

    describe('Admin Bypass Functionality', () => {
        beforeEach(async () => {
            // Create active maintenance state for all tests
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance',
            });
            await maintenanceState.save();
        });

        it('should allow admin access to dashboard during maintenance', async () => {
            const adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response.status).not.toBe(307); // Not redirected
        });

        it('should allow admin access to admin panel during maintenance', async () => {
            const adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard/admin');
            const response = await middleware(request);

            expect(response.status).not.toBe(307); // Not redirected
        });

        it('should allow admin access to API endpoints during maintenance', async () => {
            const adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            const request = createMockRequest('http://localhost:3000/api/links');
            const response = await middleware(request);

            expect(response.status).not.toBe(307); // Not redirected
        });

        it('should deny admin access if user role verification fails', async () => {
            // Create user but don't save to database to simulate lookup failure
            mockGetToken.mockResolvedValue({
                email: 'nonexistent@example.com',
                name: 'Non-existent User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response.status).toBe(307); // Redirected to maintenance
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });
    });

    describe('Redirect Behavior for Regular Users', () => {
        beforeEach(async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
                message: 'System maintenance',
            });
            await maintenanceState.save();

            // Create regular user
            const regularUser = new User({
                email: 'user@example.com',
                name: 'Regular User',
                provider: 'github',
                providerId: 'github123',
                role: 'user',
            });
            await regularUser.save();
        });

        it('should redirect regular users from dashboard to maintenance page', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });

        it('should redirect regular users from dashboard subpages to maintenance page', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard/links');
            const response = await middleware(request);

            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });

        it('should redirect regular users from API endpoints to maintenance page', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/api/links');
            const response = await middleware(request);

            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });

        it('should not redirect from maintenance API endpoints', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/api/maintenance/status');
            const response = await middleware(request);

            // Should not redirect maintenance API endpoints
            expect(response.status).not.toBe(307);
        });

        it('should not redirect from maintenance page itself', async () => {
            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/maintenance');
            const response = await middleware(request);

            // Should not redirect from maintenance page
            expect(response.status).not.toBe(307);
        });
    });

    describe('Route-Specific Behavior', () => {
        it('should not check maintenance for non-protected routes', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue(null);

            // Test public routes that should not be affected by maintenance
            const publicRoutes = [
                'http://localhost:3000/',
                'http://localhost:3000/auth/signin',
                'http://localhost:3000/privacy-policy',
                'http://localhost:3000/terms-and-services',
            ];

            for (const route of publicRoutes) {
                const request = createMockRequest(route);
                const response = await middleware(request);

                // Should not redirect public routes
                expect(response.status).not.toBe(307);
            }
        });

        it('should handle admin route protection correctly during maintenance', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            // Test unauthenticated access to admin route
            mockGetToken.mockResolvedValue(null);

            const request = createMockRequest('http://localhost:3000/dashboard/admin');
            const response = await middleware(request);

            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin');
        });

        it('should redirect non-admin authenticated users from admin routes during maintenance', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            // Create regular user
            const regularUser = new User({
                email: 'user@example.com',
                name: 'Regular User',
                provider: 'github',
                providerId: 'github123',
                role: 'user',
            });
            await regularUser.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard/admin');
            const response = await middleware(request);

            // Should redirect to maintenance page, not dashboard
            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');
        });
    });

    describe('Error Handling and Fallback Behavior', () => {
        it('should allow normal access when maintenance check fails', async () => {
            // Disconnect from database to simulate failure
            await mongoose.disconnect();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            // Should not redirect when maintenance check fails (fail-safe)
            expect(response.status).not.toBe(307);

            // Reconnect for other tests
            if (mongoServer) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });

        it('should handle token verification timeout gracefully', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            // Mock token timeout
            mockGetToken.mockRejectedValue(new Error('Token verification timeout'));

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            // Should redirect to signin for dashboard routes when token fails
            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/auth/signin');
        });

        it('should handle API route errors correctly', async () => {
            // Mock token timeout
            mockGetToken.mockRejectedValue(new Error('Token verification timeout'));

            const request = createMockRequest('http://localhost:3000/api/links');
            const response = await middleware(request);

            // Should return 500 error for API routes when middleware fails
            expect(response.status).toBe(500);
            const data = await response.json();
            expect(data).toEqual({ error: 'Internal server error' });
        });

        it('should deny admin access when role verification fails during maintenance', async () => {
            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            // Disconnect to simulate role check failure
            await mongoose.disconnect();

            const request = createMockRequest('http://localhost:3000/dashboard');
            const response = await middleware(request);

            // Should redirect to maintenance page when admin check fails during maintenance
            expect(response.status).toBe(307);
            expect(response.headers.get('location')).toBe('http://localhost:3000/maintenance');

            // Reconnect for other tests
            if (mongoServer) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });
    });

    describe('Caching Behavior', () => {
        it('should cache maintenance status for performance', async () => {
            // Create maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            // First request should query database
            const request1 = createMockRequest('http://localhost:3000/dashboard');
            const response1 = await middleware(request1);
            expect(response1.status).not.toBe(307);

            // Update maintenance state in database
            await MaintenanceState.updateOne({}, { isActive: true });

            // Second request within cache period should use cached value (inactive)
            const request2 = createMockRequest('http://localhost:3000/dashboard');
            const response2 = await middleware(request2);
            expect(response2.status).not.toBe(307); // Still using cached inactive state

            // Wait for cache to expire (this is a simplified test - in real scenarios cache expires after 30s)
            // For testing purposes, we'll just verify the caching mechanism exists
        });

        it('should use expired cache as fallback when database fails', async () => {
            // Create maintenance state and make initial request to populate cache
            const maintenanceState = new MaintenanceState({
                isActive: false,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            // First request to populate cache
            const request1 = createMockRequest('http://localhost:3000/dashboard');
            await middleware(request1);

            // Disconnect database to simulate failure
            await mongoose.disconnect();

            // Second request should use cached data as fallback
            const request2 = createMockRequest('http://localhost:3000/dashboard');
            const response2 = await middleware(request2);

            // Should not redirect (using cached inactive state)
            expect(response2.status).not.toBe(307);

            // Reconnect for other tests
            if (mongoServer) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });
    });

    describe('Logging and Monitoring', () => {
        it('should log admin access during maintenance', async () => {
            const consoleSpy = jest.spyOn(console, 'log');

            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            // Create admin user
            const adminUser = new User({
                email: 'admin@example.com',
                name: 'Admin User',
                provider: 'github',
                providerId: 'github123',
                role: 'admin',
            });
            await adminUser.save();

            mockGetToken.mockResolvedValue({
                email: 'admin@example.com',
                name: 'Admin User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            await middleware(request);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Allowing admin access during maintenance',
                expect.objectContaining({
                    email: 'admin@example.com',
                    pathname: '/dashboard',
                })
            );

            consoleSpy.mockRestore();
        });

        it('should log non-admin redirects during maintenance', async () => {
            const consoleSpy = jest.spyOn(console, 'log');

            // Create active maintenance state
            const maintenanceState = new MaintenanceState({
                isActive: true,
                activatedBy: 'admin@example.com',
                activatedAt: new Date(),
            });
            await maintenanceState.save();

            // Create regular user
            const regularUser = new User({
                email: 'user@example.com',
                name: 'Regular User',
                provider: 'github',
                providerId: 'github123',
                role: 'user',
            });
            await regularUser.save();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Regular User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            await middleware(request);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Redirecting non-admin user to maintenance page',
                expect.objectContaining({
                    email: 'user@example.com',
                    pathname: '/dashboard',
                })
            );

            consoleSpy.mockRestore();
        });

        it('should log errors appropriately', async () => {
            const consoleSpy = jest.spyOn(console, 'error');

            // Disconnect to simulate database error
            await mongoose.disconnect();

            mockGetToken.mockResolvedValue({
                email: 'user@example.com',
                name: 'Test User',
            } as any);

            const request = createMockRequest('http://localhost:3000/dashboard');
            await middleware(request);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error checking maintenance status'),
                expect.any(Object)
            );

            consoleSpy.mockRestore();

            // Reconnect for other tests
            if (mongoServer) {
                const mongoUri = mongoServer.getUri();
                await mongoose.connect(mongoUri);
            }
        });
    });
});