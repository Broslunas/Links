import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ConditionalLayout } from '../ConditionalLayout';

// Mock Next.js usePathname hook
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

jest.mock('../RedirectLayout', () => ({
    RedirectLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="redirect-layout">{children}</div>
    ),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('ConditionalLayout - Redirect Error Pages', () => {
    const TestComponent = () => <div>Test Content</div>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('applies RedirectLayout to slug-based error pages', () => {
        mockUsePathname.mockReturnValue('/invalid-slug');

        render(
            <ConditionalLayout>
                <TestComponent />
            </ConditionalLayout>
        );

        expect(screen.getByTestId('redirect-layout')).toBeInTheDocument();
        expect(screen.queryByTestId('global-layout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument();
    });

});