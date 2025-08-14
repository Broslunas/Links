import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ConditionalLayout } from '../ConditionalLayout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

// Mock the layout components
jest.mock('../DashboardLayout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-layout">{children}</div>
    ),
}));

jest.mock('../GlobalLayout', () => ({
    GlobalLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="global-layout">{children}</div>
    ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('ConditionalLayout', () => {
    const TestContent = () => <div data-testid="test-content">Test Content</div>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Dashboard Routes', () => {
        it('should render DashboardLayout for /dashboard route', () => {
            mockUsePathname.mockReturnValue('/dashboard');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();
        });

        it('should render DashboardLayout for /dashboard/links route', () => {
            mockUsePathname.mockReturnValue('/dashboard/links');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();
        });

        it('should render DashboardLayout for /dashboard/analytics route', () => {
            mockUsePathname.mockReturnValue('/dashboard/analytics');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();
        });

        it('should render DashboardLayout for /dashboard/settings/profile route', () => {
            mockUsePathname.mockReturnValue('/dashboard/settings/profile');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();
        });
    });

    describe('External Routes', () => {
        it('should render GlobalLayout for home route', () => {
            mockUsePathname.mockReturnValue('/');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for /pricing route', () => {
            mockUsePathname.mockReturnValue('/pricing');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for /features route', () => {
            mockUsePathname.mockReturnValue('/features');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for /api route', () => {
            mockUsePathname.mockReturnValue('/api');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for /help route', () => {
            mockUsePathname.mockReturnValue('/help');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for /auth/signin route', () => {
            mockUsePathname.mockReturnValue('/auth/signin');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should render GlobalLayout for routes that contain "dashboard" but do not start with it', () => {
            mockUsePathname.mockReturnValue('/user-dashboard');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should render GlobalLayout for empty pathname', () => {
            mockUsePathname.mockReturnValue('');

            render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('global-layout')).toBeInTheDocument();
            expect(screen.getByTestId('test-content')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
        });

        it('should handle children prop correctly in both layouts', () => {
            // Test with dashboard layout
            mockUsePathname.mockReturnValue('/dashboard');
            const { rerender } = render(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('test-content')).toBeInTheDocument();

            // Test with global layout
            mockUsePathname.mockReturnValue('/');
            rerender(
                <ConditionalLayout>
                    <TestContent />
                </ConditionalLayout>
            );

            expect(screen.getByTestId('test-content')).toBeInTheDocument();
        });
    });
});