import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ConditionalLayout } from '../ConditionalLayout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

// Mock session provider and other dependencies that might be used by layouts
jest.mock('next-auth/react', () => ({
    useSession: () => ({
        data: null,
        status: 'unauthenticated'
    }),
}));

// Mock the actual layout components with more realistic implementations
jest.mock('../DashboardLayout', () => ({
    DashboardLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="dashboard-layout">
            <header data-testid="dashboard-header">Dashboard Header</header>
            <main>{children}</main>
        </div>
    ),
}));

jest.mock('../GlobalLayout', () => ({
    GlobalLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="global-layout">
            <header data-testid="global-header">Global Header</header>
            <main>{children}</main>
            <footer data-testid="global-footer">Global Footer</footer>
        </div>
    ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('ConditionalLayout Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should provide complete layout structure for dashboard routes', () => {
        mockUsePathname.mockReturnValue('/dashboard/links');

        render(
            <ConditionalLayout>
                <div data-testid="page-content">Links Management Page</div>
            </ConditionalLayout>
        );

        // Should have dashboard layout structure
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();

        // Should NOT have global layout elements
        expect(screen.queryByTestId('global-header')).not.toBeInTheDocument();
        expect(screen.queryByTestId('global-footer')).not.toBeInTheDocument();
    });

    it('should provide complete layout structure for external routes', () => {
        mockUsePathname.mockReturnValue('/pricing');

        render(
            <ConditionalLayout>
                <div data-testid="page-content">Pricing Page</div>
            </ConditionalLayout>
        );

        // Should have global layout structure
        expect(screen.getByTestId('global-layout')).toBeInTheDocument();
        expect(screen.getByTestId('global-header')).toBeInTheDocument();
        expect(screen.getByTestId('global-footer')).toBeInTheDocument();
        expect(screen.getByTestId('page-content')).toBeInTheDocument();

        // Should NOT have dashboard layout elements
        expect(screen.queryByTestId('dashboard-header')).not.toBeInTheDocument();
    });

    it('should handle route transitions correctly', () => {
        // Start with external route
        mockUsePathname.mockReturnValue('/');
        const { rerender } = render(
            <ConditionalLayout>
                <div data-testid="page-content">Home Page</div>
            </ConditionalLayout>
        );

        expect(screen.getByTestId('global-layout')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();

        // Transition to dashboard route
        mockUsePathname.mockReturnValue('/dashboard');
        rerender(
            <ConditionalLayout>
                <div data-testid="page-content">Dashboard Page</div>
            </ConditionalLayout>
        );

        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
        expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();

        // Transition back to external route
        mockUsePathname.mockReturnValue('/features');
        rerender(
            <ConditionalLayout>
                <div data-testid="page-content">Features Page</div>
            </ConditionalLayout>
        );

        expect(screen.getByTestId('global-layout')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
    });

    it('should preserve content across layout changes', () => {
        const TestContent = ({ message }: { message: string }) => (
            <div data-testid="dynamic-content">{message}</div>
        );

        // Test with dashboard route
        mockUsePathname.mockReturnValue('/dashboard/analytics');
        const { rerender } = render(
            <ConditionalLayout>
                <TestContent message="Analytics Dashboard" />
            </ConditionalLayout>
        );

        expect(screen.getByTestId('dynamic-content')).toHaveTextContent('Analytics Dashboard');

        // Test with external route
        mockUsePathname.mockReturnValue('/help');
        rerender(
            <ConditionalLayout>
                <TestContent message="Help Center" />
            </ConditionalLayout>
        );

        expect(screen.getByTestId('dynamic-content')).toHaveTextContent('Help Center');
    });
});