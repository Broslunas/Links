import React from 'react';
import { render, screen } from '@testing-library/react';
import { RedirectError } from '../RedirectError';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
        return <a href={href}>{children}</a>;
    };
});

describe('RedirectError', () => {
    describe('not_found error type', () => {
        it('renders 404 error with default message', () => {
            render(<RedirectError type="not_found" />);

            expect(screen.getByText('404')).toBeInTheDocument();
            expect(screen.getByText('Enlace No Encontrado')).toBeInTheDocument();
            expect(screen.getByText(/El enlace que buscas no existe o ha sido eliminado/)).toBeInTheDocument();
            expect(screen.getByText(/LINK_NOT_FOUND/)).toBeInTheDocument();
        });

        it('renders 404 error with custom message', () => {
            const customMessage = 'Custom not found message';
            render(<RedirectError type="not_found" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
        });

        it('displays slug when provided', () => {
            const slug = 'test-slug';
            render(<RedirectError type="not_found" slug={slug} />);

            expect(screen.getByText(`/${slug}`)).toBeInTheDocument();
        });

        it('renders navigation buttons', () => {
            render(<RedirectError type="not_found" />);

            expect(screen.getByText('Ir a la Página Principal')).toBeInTheDocument();
            expect(screen.getByText('Ir al Dashboard')).toBeInTheDocument();
        });

        it('renders helpful tips', () => {
            render(<RedirectError type="not_found" />);

            expect(screen.getByText('¿Qué puedes hacer?')).toBeInTheDocument();
            expect(screen.getByText(/Verifica que la URL esté escrita correctamente/)).toBeInTheDocument();
            expect(screen.getByText(/Contacta a la persona que compartió este enlace/)).toBeInTheDocument();
            expect(screen.getByText(/Crea tus propios enlaces cortos/)).toBeInTheDocument();
        });
    });

    describe('expired error type', () => {
        it('renders expired error with default message', () => {
            render(<RedirectError type="expired" />);

            expect(screen.getByText('⏰')).toBeInTheDocument();
            expect(screen.getByText('Enlace Expirado')).toBeInTheDocument();
            expect(screen.getByText(/Este enlace temporal ha expirado/)).toBeInTheDocument();
            expect(screen.getByText(/LINK_EXPIRED/)).toBeInTheDocument();
        });

        it('renders expired error with expiration date', () => {
            const expirationDate = new Date('2024-01-15');
            render(<RedirectError type="expired" expirationDate={expirationDate} />);

            expect(screen.getByText(/el 15\/1\/2024/)).toBeInTheDocument();
        });

        it('renders expired error with custom message', () => {
            const customMessage = 'Custom expired message';
            render(<RedirectError type="expired" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
        });

        it('renders helpful tips for expired links', () => {
            render(<RedirectError type="expired" />);

            expect(screen.getByText(/Solicita un nuevo enlace al creador/)).toBeInTheDocument();
            expect(screen.getByText(/Verifica si hay una versión actualizada disponible/)).toBeInTheDocument();
            expect(screen.getByText(/Los enlaces temporales expiran por seguridad/)).toBeInTheDocument();
        });
    });

    describe('server_error error type', () => {
        it('renders server error with default message', () => {
            render(<RedirectError type="server_error" />);

            expect(screen.getByText('500')).toBeInTheDocument();
            expect(screen.getByText('Error del Servidor')).toBeInTheDocument();
            expect(screen.getByText(/Ha ocurrido un error inesperado al procesar la redirección/)).toBeInTheDocument();
            expect(screen.getByText(/REDIRECT_SERVER_ERROR/)).toBeInTheDocument();
        });

        it('renders server error with custom message', () => {
            const customMessage = 'Custom server error message';
            render(<RedirectError type="server_error" message={customMessage} />);

            expect(screen.getByText(customMessage)).toBeInTheDocument();
        });

        it('renders try again button for server errors', () => {
            render(<RedirectError type="server_error" />);

            expect(screen.getByText('Intentar de Nuevo')).toBeInTheDocument();
        });

        it('renders helpful tips for server errors', () => {
            render(<RedirectError type="server_error" />);

            expect(screen.getByText(/Intenta recargar la página/)).toBeInTheDocument();
            expect(screen.getByText(/Vuelve a intentarlo en unos minutos/)).toBeInTheDocument();
            expect(screen.getByText(/El problema ha sido reportado automáticamente/)).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('has proper heading structure', () => {
            render(<RedirectError type="not_found" />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            const subHeading = screen.getByRole('heading', { level: 2 });
            const tipsHeading = screen.getByRole('heading', { level: 3 });

            expect(mainHeading).toHaveTextContent('404');
            expect(subHeading).toHaveTextContent('Enlace No Encontrado');
            expect(tipsHeading).toHaveTextContent('¿Qué puedes hacer?');
        });

        it('has proper link accessibility', () => {
            render(<RedirectError type="not_found" />);

            const homeLink = screen.getByRole('link', { name: /Ir a la Página Principal/ });
            const dashboardLink = screen.getByRole('link', { name: /Ir al Dashboard/ });

            expect(homeLink).toHaveAttribute('href', '/');
            expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        });
    });

    describe('responsive design', () => {
        it('applies responsive classes', () => {
            const { container } = render(<RedirectError type="not_found" />);

            const mainContainer = container.firstChild;
            expect(mainContainer).toHaveClass('max-w-md', 'w-full', 'text-center');
        });

        it('applies proper spacing classes', () => {
            render(<RedirectError type="not_found" />);

            const buttonContainer = screen.getByText('Ir a la Página Principal').closest('.space-y-4');
            expect(buttonContainer).toBeInTheDocument();
        });
    });
});