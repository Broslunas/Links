import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import SettingsPage from '../page';
import { useToast } from '../../../../hooks/useToast';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock the useToast hook
jest.mock('../../../../hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock fetch for API token requests
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock the ApiTokenManager component to avoid complex integration issues
jest.mock('../../../../components/dashboard/ApiTokenManager', () => ({
    ApiTokenManager: () => <div data-testid="api-token-manager">API Token Manager</div>
}));

describe('Settings Page', () => {
    const mockSuccess = jest.fn();
    const mockError = jest.fn();
    const mockAddToast = jest.fn();
    const mockRemoveToast = jest.fn();
    const mockWarning = jest.fn();
    const mockInfo = jest.fn();

    beforeEach(() => {
        mockUseToast.mockReturnValue({
            success: mockSuccess,
            error: mockError,
            toasts: [],
            addToast: mockAddToast,
            removeToast: mockRemoveToast,
            warning: mockWarning,
            info: mockInfo,
        });

        mockFetch.mockClear();
        mockSuccess.mockClear();
        mockError.mockClear();
    });

    describe('Authenticated User', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: {
                    user: {
                        name: 'Test User',
                        email: 'test@example.com',
                        image: 'https://example.com/avatar.jpg',
                        provider: 'google',
                    },
                },
                status: 'authenticated',
                update: jest.fn(),
            });
        });

        it('renders all settings sections including API token management', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Configuración')).toBeInTheDocument();
            });

            // Check that all main sections are present
            expect(screen.getByText('Información del Perfil')).toBeInTheDocument();
            expect(screen.getByText('Preferencias de la Aplicación')).toBeInTheDocument();
            expect(screen.getByTestId('api-token-manager')).toBeInTheDocument();
            expect(screen.getByText('Datos y Privacidad')).toBeInTheDocument();
            expect(screen.getByText('Zona de Peligro')).toBeInTheDocument();
        });

        it('displays user information correctly', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
            });

            expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
            expect(screen.getByText('Conectado con google')).toBeInTheDocument();
        });

        it('shows API token management section', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByTestId('api-token-manager')).toBeInTheDocument();
            });
        });

        it('includes theme toggle functionality', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Tema de la Aplicación')).toBeInTheDocument();
            });
        });

        it('includes data export and privacy options', async () => {
            render(<SettingsPage />);

            await waitFor(() => {
                expect(screen.getByText('Exportar Datos')).toBeInTheDocument();
            });

            expect(screen.getByText('Eliminar Todos los Datos')).toBeInTheDocument();
            expect(screen.getByText('Eliminar Cuenta')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'loading',
                update: jest.fn(),
            });
        });

        it('shows loading spinner while checking authentication', () => {
            render(<SettingsPage />);

            expect(screen.getByText('Cargando configuración...')).toBeInTheDocument();
            expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
        });
    });

    describe('Unauthenticated User', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
                update: jest.fn(),
            });

            // Mock window.location.href
            delete (window as any).location;
            (window as any).location = { href: '' };
        });

        it('shows redirect message for unauthenticated users', () => {
            render(<SettingsPage />);

            expect(screen.getByText('Redirigiendo a la página de inicio de sesión...')).toBeInTheDocument();
        });
    });
});