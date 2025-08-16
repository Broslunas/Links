import React from 'react';
import { render, screen } from '@testing-library/react';
import SlugErrorPage from '../error';
import SlugNotFound from '../not-found';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

describe('Slug Error Pages', () => {
    afterEach(() => {
        mockConsoleError.mockClear();
    });

    afterAll(() => {
        mockConsoleError.mockRestore();
    });

    describe('SlugNotFound', () => {
        it('renders 404 error page', () => {
            render(<SlugNotFound />);

            expect(screen.getByText('404')).toBeInTheDocument();
            expect(screen.getByText('Enlace No Encontrado')).toBeInTheDocument();
            expect(screen.getByText(/El enlace que buscas no existe o ha expirado/)).toBeInTheDocument();
        });

        it('renders navigation buttons', () => {
            render(<SlugNotFound />);

            expect(screen.getByText('Ir a la Página Principal')).toBeInTheDocument();
            expect(screen.getByText('Ir al Dashboard')).toBeInTheDocument();
        });

        it('has proper error code', () => {
            render(<SlugNotFound />);

            expect(screen.getByText(/LINK_NOT_FOUND/)).toBeInTheDocument();
        });
    });

    describe('SlugErrorPage', () => {
        const mockReset = jest.fn();

        beforeEach(() => {
            mockReset.mockClear();
        });

        it('renders server error for generic errors', () => {
            const error = new Error('Generic server error');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText('500')).toBeInTheDocument();
            expect(screen.getByText('Error del Servidor')).toBeInTheDocument();
            expect(screen.getByText(/Ha ocurrido un error inesperado al procesar la redirección/)).toBeInTheDocument();
        });

        it('renders expired error for ExpiredLinkError', () => {
            const error = new Error('Link has expired');
            error.name = 'ExpiredLinkError';
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText('⏰')).toBeInTheDocument();
            expect(screen.getByText('Enlace Expirado')).toBeInTheDocument();
            expect(screen.getByText('Link has expired')).toBeInTheDocument();
        });

        it('renders database error message for DatabaseConnectionError', () => {
            const error = new Error('Database connection failed');
            error.name = 'DatabaseConnectionError';
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText('500')).toBeInTheDocument();
            expect(screen.getByText(/No se pudo conectar con la base de datos/)).toBeInTheDocument();
        });

        it('handles ECONNREFUSED errors', () => {
            const error = new Error('ECONNREFUSED connection failed');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText(/No se pudo conectar con la base de datos/)).toBeInTheDocument();
        });

        it('handles authentication errors', () => {
            const error = new Error('Authentication failed');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText(/Error de autenticación al procesar la redirección/)).toBeInTheDocument();
        });

        it('handles network errors', () => {
            const error = new Error('Network request failed');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText(/Error de conexión al procesar la redirección/)).toBeInTheDocument();
        });

        it('handles timeout errors', () => {
            const error = new Error('Request timeout occurred');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText(/La solicitud ha tardado demasiado tiempo/)).toBeInTheDocument();
        });

        it('logs error to console', () => {
            const error = new Error('Test error');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(mockConsoleError).toHaveBeenCalledWith('Slug redirect error:', error);
        });

        it('renders navigation buttons', () => {
            const error = new Error('Test error');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText('Ir a la Página Principal')).toBeInTheDocument();
            expect(screen.getByText('Ir al Dashboard')).toBeInTheDocument();
        });

        it('renders try again button for server errors', () => {
            const error = new Error('Server error');
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.getByText('Intentar de Nuevo')).toBeInTheDocument();
        });

        it('does not render try again button for expired errors', () => {
            const error = new Error('Link expired');
            error.name = 'ExpiredLinkError';
            render(<SlugErrorPage error={error} reset={mockReset} />);

            expect(screen.queryByText('Intentar de Nuevo')).not.toBeInTheDocument();
        });
    });

    describe('Error handling with expiration dates', () => {
        it('displays expiration date when available', () => {
            const error = new Error('Link expired on specific date') as any;
            error.name = 'ExpiredLinkError';
            error.expirationDate = new Date('2024-01-15');

            render(<SlugErrorPage error={error} reset={jest.fn()} />);

            // The expiration date should be displayed in the error message
            expect(screen.getByText(/Link expired on specific date/)).toBeInTheDocument();
        });
    });
});