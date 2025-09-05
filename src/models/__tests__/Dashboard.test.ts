import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Dashboard, { IDashboard } from '../Dashboard';

describe('Dashboard Model', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await Dashboard.deleteMany({});
    });

    describe('Dashboard Creation', () => {
        it('should create a dashboard with valid data', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Test Dashboard',
                description: 'Test description',
                layout: {
                    columns: 12,
                    rows: 20,
                    gap: 16,
                    responsive: true
                },
                widgets: [],
                isDefault: false,
                isShared: false,
                sharedWith: []
            };

            const dashboard = new Dashboard(dashboardData);
            const savedDashboard = await dashboard.save();

            expect(savedDashboard._id).toBeDefined();
            expect(savedDashboard.name).toBe('Test Dashboard');
            expect(savedDashboard.description).toBe('Test description');
            expect(savedDashboard.layout.columns).toBe(12);
            expect(savedDashboard.widgets).toHaveLength(0);
            expect(savedDashboard.isDefault).toBe(false);
            expect(savedDashboard.createdAt).toBeDefined();
            expect(savedDashboard.updatedAt).toBeDefined();
        });

        it('should create a dashboard with default layout', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Default Layout Dashboard'
            };

            const dashboard = new Dashboard(dashboardData);
            const savedDashboard = await dashboard.save();

            expect(savedDashboard.layout.columns).toBe(12);
            expect(savedDashboard.layout.rows).toBe(20);
            expect(savedDashboard.layout.gap).toBe(16);
            expect(savedDashboard.layout.responsive).toBe(true);
        });

        it('should require name field', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId()
                // Missing name
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow(/name/);
        });

        it('should require userId field', async () => {
            const dashboardData = {
                name: 'Test Dashboard'
                // Missing userId
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow(/userId/);
        });

        it('should validate name length', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'A'.repeat(101) // Too long
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should validate description length', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Test Dashboard',
                description: 'A'.repeat(501) // Too long
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });
    });

    describe('Widget Management', () => {
        it('should add widgets to dashboard', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Widget Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'link-stats',
                        position: { x: 0, y: 0 },
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    },
                    {
                        id: 'widget-2',
                        type: 'link-list',
                        position: { x: 4, y: 0 },
                        size: { width: 6, height: 4 },
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);
            const savedDashboard = await dashboard.save();

            expect(savedDashboard.widgets).toHaveLength(2);
            expect(savedDashboard.widgets[0].id).toBe('widget-1');
            expect(savedDashboard.widgets[0].type).toBe('link-stats');
            expect(savedDashboard.widgets[1].id).toBe('widget-2');
            expect(savedDashboard.widgets[1].type).toBe('link-list');
        });

        it('should validate widget types', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Widget Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'invalid-type', // Invalid type
                        position: { x: 0, y: 0 },
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should validate widget positions', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Position Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'link-stats',
                        position: { x: -1, y: 0 }, // Invalid position
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should validate widget sizes', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Size Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'link-stats',
                        position: { x: 0, y: 0 },
                        size: { width: 0, height: 2 }, // Invalid size
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should prevent duplicate widget IDs', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Duplicate Widget Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'link-stats',
                        position: { x: 0, y: 0 },
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    },
                    {
                        id: 'widget-1', // Duplicate ID
                        type: 'link-list',
                        position: { x: 4, y: 0 },
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow(/unique/);
        });

        it('should prevent overlapping widgets', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Overlapping Widget Dashboard',
                widgets: [
                    {
                        id: 'widget-1',
                        type: 'link-stats',
                        position: { x: 0, y: 0 },
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    },
                    {
                        id: 'widget-2',
                        type: 'link-list',
                        position: { x: 2, y: 1 }, // Overlaps with widget-1
                        size: { width: 4, height: 2 },
                        config: { showHeader: true },
                        filters: []
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow(/overlap/);
        });
    });

    describe('Layout Validation', () => {
        it('should validate layout columns', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Layout Dashboard',
                layout: {
                    columns: 0, // Invalid
                    rows: 20,
                    gap: 16,
                    responsive: true
                }
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should validate layout rows', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Layout Dashboard',
                layout: {
                    columns: 12,
                    rows: 0, // Invalid
                    gap: 16,
                    responsive: true
                }
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });

        it('should validate layout gap', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Layout Dashboard',
                layout: {
                    columns: 12,
                    rows: 20,
                    gap: -1, // Invalid
                    responsive: true
                }
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });
    });

    describe('Sharing and Permissions', () => {
        it('should handle shared dashboards', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Shared Dashboard',
                isShared: true,
                sharedWith: [
                    {
                        userId: 'user-123',
                        permission: 'read',
                        sharedAt: new Date()
                    },
                    {
                        userId: 'user-456',
                        permission: 'write',
                        sharedAt: new Date()
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);
            const savedDashboard = await dashboard.save();

            expect(savedDashboard.isShared).toBe(true);
            expect(savedDashboard.sharedWith).toHaveLength(2);
            expect(savedDashboard.sharedWith[0].userId).toBe('user-123');
            expect(savedDashboard.sharedWith[0].permission).toBe('read');
            expect(savedDashboard.sharedWith[1].userId).toBe('user-456');
            expect(savedDashboard.sharedWith[1].permission).toBe('write');
        });

        it('should validate permission values', async () => {
            const dashboardData = {
                userId: new mongoose.Types.ObjectId(),
                name: 'Invalid Permission Dashboard',
                isShared: true,
                sharedWith: [
                    {
                        userId: 'user-123',
                        permission: 'invalid', // Invalid permission
                        sharedAt: new Date()
                    }
                ]
            };

            const dashboard = new Dashboard(dashboardData);

            await expect(dashboard.save()).rejects.toThrow();
        });
    });

    describe('Default Dashboard Constraints', () => {
        it('should allow only one default dashboard per user', async () => {
            const userId = new mongoose.Types.ObjectId();

            // Create first default dashboard
            const dashboard1 = new Dashboard({
                userId,
                name: 'Default Dashboard 1',
                isDefault: true
            });
            await dashboard1.save();

            // Try to create second default dashboard for same user
            const dashboard2 = new Dashboard({
                userId,
                name: 'Default Dashboard 2',
                isDefault: true
            });

            await expect(dashboard2.save()).rejects.toThrow();
        });

        it('should allow multiple non-default dashboards per user', async () => {
            const userId = new mongoose.Types.ObjectId();

            const dashboard1 = new Dashboard({
                userId,
                name: 'Dashboard 1',
                isDefault: false
            });
            await dashboard1.save();

            const dashboard2 = new Dashboard({
                userId,
                name: 'Dashboard 2',
                isDefault: false
            });
            await dashboard2.save();

            expect(dashboard1._id).toBeDefined();
            expect(dashboard2._id).toBeDefined();
        });

        it('should allow default dashboards for different users', async () => {
            const userId1 = new mongoose.Types.ObjectId();
            const userId2 = new mongoose.Types.ObjectId();

            const dashboard1 = new Dashboard({
                userId: userId1,
                name: 'User 1 Default',
                isDefault: true
            });
            await dashboard1.save();

            const dashboard2 = new Dashboard({
                userId: userId2,
                name: 'User 2 Default',
                isDefault: true
            });
            await dashboard2.save();

            expect(dashboard1._id).toBeDefined();
            expect(dashboard2._id).toBeDefined();
        });
    });

    describe('Indexes', () => {
        it('should have proper indexes for performance', async () => {
            const indexes = await Dashboard.collection.getIndexes();

            // Check that we have the expected indexes
            expect(indexes).toHaveProperty('userId_1');
            expect(indexes).toHaveProperty('userId_1_createdAt_-1');
            expect(indexes).toHaveProperty('userId_1_isDefault_1');
            expect(indexes).toHaveProperty('isShared_1');
            expect(indexes).toHaveProperty('sharedWith.userId_1');
        });
    });
});