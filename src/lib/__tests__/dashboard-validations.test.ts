import {
    isValidDashboardName,
    isValidDashboardDescription,
    isValidWidgetType,
    isValidWidgetPosition,
    isValidWidgetSize,
    isValidWidgetFilter,
    isValidDashboardLayout,
    validateCreateDashboardData,
    validateUpdateDashboardData,
    validateCreateWidgetData,
    validateUpdateWidgetData
} from '../validations';

describe('Dashboard Validations', () => {
    describe('isValidDashboardName', () => {
        it('should validate correct dashboard names', () => {
            expect(isValidDashboardName('My Dashboard')).toBe(true);
            expect(isValidDashboardName('A')).toBe(true);
            expect(isValidDashboardName('A'.repeat(100))).toBe(true);
        });

        it('should reject invalid dashboard names', () => {
            expect(isValidDashboardName('')).toBe(false);
            expect(isValidDashboardName('   ')).toBe(false);
            expect(isValidDashboardName('A'.repeat(101))).toBe(false);
            expect(isValidDashboardName(123)).toBe(false);
        });
    });

    describe('isValidWidgetType', () => {
        it('should validate correct widget types', () => {
            expect(isValidWidgetType('link-stats')).toBe(true);
            expect(isValidWidgetType('link-list')).toBe(true);
            expect(isValidWidgetType('analytics-chart')).toBe(true);
            expect(isValidWidgetType('quick-actions')).toBe(true);
            expect(isValidWidgetType('recent-activity')).toBe(true);
            expect(isValidWidgetType('top-performers')).toBe(true);
        });

        it('should reject invalid widget types', () => {
            expect(isValidWidgetType('invalid-type')).toBe(false);
            expect(isValidWidgetType('')).toBe(false);
            expect(isValidWidgetType('LINK-STATS')).toBe(false);
        });
    });

    describe('validateCreateDashboardData', () => {
        it('should validate correct dashboard creation data', () => {
            const data = {
                name: 'Test Dashboard',
                description: 'Test description'
            };

            const result = validateCreateDashboardData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid dashboard creation data', () => {
            const data = {
                name: '', // Invalid name
                description: 'A'.repeat(501) // Too long description
            };

            const result = validateCreateDashboardData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateCreateWidgetData', () => {
        it('should validate correct widget creation data', () => {
            const data = {
                type: 'link-stats',
                position: { x: 0, y: 0 },
                size: { width: 4, height: 2 }
            };

            const result = validateCreateWidgetData(data);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid widget creation data', () => {
            const data = {
                type: 'invalid-type',
                position: { x: -1, y: 0 },
                size: { width: 0, height: 2 }
            };

            const result = validateCreateWidgetData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});