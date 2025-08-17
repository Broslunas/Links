import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { GlobalHeader } from '../GlobalHeader';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock next/navigation
jest.mock('next/navigation');
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

// Mock theme hook
jest.mock('../../../hooks/useTheme', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
    }),
}));

describe('GlobalHeader', () => {
    beforeEach(() => {
        mockUsePathname.mockReturnValue('/');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders logo and navigation items', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        // Check logo
        expect(screen.getByLabelText('Broslunas Links - Ir al inicio')).toBeInTheDocument();
        expect(screen.getByText('Broslunas Links')).toBeInTheDocument();

        // Check navigation items
        expect(screen.getByText('Inicio')).toBeInTheDocument();
        expect(screen.getByText('Características')).toBeInTheDocument();
        expect(screen.getByText('Precios')).toBeInTheDocument();
        expect(screen.getByText('API')).toBeInTheDocument();
        expect(screen.getByText('Ayuda')).toBeInTheDocument();
    });

    it('shows authentication buttons when not logged in', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        expect(screen.getAllByText('Iniciar Sesión')).toHaveLength(1); // Desktop only initially
        expect(screen.getAllByText('Registrarse')).toHaveLength(1); // Desktop only initially
    });

    it('shows dashboard and logout buttons when logged in', () => {
        mockUseSession.mockReturnValue({
            data: {
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                },
                expires: '2024-12-31T23:59:59.999Z',
            },
            status: 'authenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        expect(screen.getAllByText('Ir al Dashboard')).toHaveLength(1); // Desktop only initially
        expect(screen.getAllByText('Cerrar Sesión')).toHaveLength(1); // Desktop only initially
    });

    it('shows loading state during authentication check', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        // Should show loading skeleton
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('highlights active navigation item', () => {
        mockUsePathname.mockReturnValue('/features');
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        const featuresLink = screen.getByText('Características');
        expect(featuresLink).toHaveClass('text-blue-600');
        expect(featuresLink).toHaveAttribute('aria-current', 'page');
    });

    it('opens and closes mobile menu', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        const menuButton = screen.getByLabelText('Abrir menú de navegación');

        // Open menu
        fireEvent.click(menuButton);

        await waitFor(() => {
            expect(screen.getByLabelText('Cerrar menú de navegación')).toBeInTheDocument();
            expect(screen.getAllByText('Iniciar Sesión')).toHaveLength(2); // Desktop + Mobile
        });

        // Close menu
        fireEvent.click(screen.getByLabelText('Cerrar menú de navegación'));

        await waitFor(() => {
            expect(screen.getByLabelText('Abrir menú de navegación')).toBeInTheDocument();
            expect(screen.getAllByText('Iniciar Sesión')).toHaveLength(1); // Desktop only
        });
    });

    it('closes mobile menu when clicking on navigation item', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        const menuButton = screen.getByLabelText('Abrir menú de navegación');

        // Open menu
        fireEvent.click(menuButton);

        await waitFor(() => {
            expect(screen.getAllByText('Características')).toHaveLength(2); // Desktop + Mobile
        });

        // Click on mobile navigation item
        const mobileNavItems = screen.getAllByText('Características');
        const mobileNavItem = mobileNavItems.find(item =>
            item.closest('.md\\:hidden')
        );

        if (mobileNavItem) {
            fireEvent.click(mobileNavItem);
        }

        await waitFor(() => {
            expect(screen.getByLabelText('Abrir menú de navegación')).toBeInTheDocument();
        });
    });

    it('closes mobile menu on escape key', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        const menuButton = screen.getByLabelText('Abrir menú de navegación');

        // Open menu
        fireEvent.click(menuButton);

        await waitFor(() => {
            expect(screen.getByLabelText('Cerrar menú de navegación')).toBeInTheDocument();
        });

        // Press escape
        fireEvent.keyDown(document, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.getByLabelText('Abrir menú de navegación')).toBeInTheDocument();
        });
    });

    it('has proper accessibility attributes', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        });

        render(<GlobalHeader />);

        // Check navigation role
        expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();

        // Check logo accessibility
        expect(screen.getByLabelText('Broslunas Links - Ir al inicio')).toBeInTheDocument();

        // Check mobile menu button
        const menuButton = screen.getByLabelText('Abrir menú de navegación');
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        expect(menuButton).toHaveAttribute('aria-controls', 'mobile-menu');
    });
});