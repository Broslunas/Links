import React from 'react';
import { render, screen } from '@testing-library/react';
import { GlobalFooter } from '../GlobalFooter';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return function MockLink({ children, href, ...props }: any) {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        );
    };
});

describe('GlobalFooter', () => {
    beforeEach(() => {
        render(<GlobalFooter />);
    });

    describe('Company Information Section', () => {
        it('should display company logo and name', () => {
            expect(screen.getByText('Broslunas Links')).toBeInTheDocument();
            expect(screen.getByText('BL')).toBeInTheDocument();
        });

        it('should display company description', () => {
            expect(screen.getByText(/Un acortador de URLs moderno/)).toBeInTheDocument();
        });

        it('should display social media links', () => {
            const twitterLink = screen.getByLabelText('Twitter');
            const githubLink = screen.getByLabelText('GitHub');
            const linkedinLink = screen.getByLabelText('LinkedIn');

            expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/broslunas');
            expect(githubLink).toHaveAttribute('href', 'https://github.com/broslunas');
            expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/company/broslunas');

            // Check that external links have proper attributes
            expect(twitterLink).toHaveAttribute('target', '_blank');
            expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
        });
    });

    describe('Navigation Sections', () => {
        it('should display all navigation sections', () => {
            expect(screen.getByText('Producto')).toBeInTheDocument();
            expect(screen.getByText('Soporte')).toBeInTheDocument();
            expect(screen.getByText('Legal')).toBeInTheDocument();
        });

        it('should display Producto section links', () => {
            expect(screen.getByText('Características')).toBeInTheDocument();
            expect(screen.getByText('Precios')).toBeInTheDocument();
            expect(screen.getByText('API')).toBeInTheDocument();
            expect(screen.getByText('Integraciones')).toBeInTheDocument();
        });

        it('should display Soporte section links', () => {
            expect(screen.getByText('Ayuda')).toBeInTheDocument();
            expect(screen.getByText('Documentación')).toBeInTheDocument();
            expect(screen.getByText('Contacto')).toBeInTheDocument();
            expect(screen.getByText('Estado del Servicio')).toBeInTheDocument();
        });

        it('should display Legal section links', () => {
            expect(screen.getByText('Términos de Servicio')).toBeInTheDocument();
            expect(screen.getByText('Política de Privacidad')).toBeInTheDocument();
            expect(screen.getByText('Política de Cookies')).toBeInTheDocument();
            expect(screen.getByText('GDPR')).toBeInTheDocument();
        });

        it('should handle external links correctly', () => {
            const contactLink = screen.getByText('Contacto');
            const statusLink = screen.getByText('Estado del Servicio');

            expect(contactLink).toHaveAttribute('href', 'https://broslunas.com/contacto');
            expect(contactLink).toHaveAttribute('target', '_blank');
            expect(contactLink).toHaveAttribute('rel', 'noopener noreferrer');

            expect(statusLink).toHaveAttribute('href', '/status');
            expect(statusLink).toHaveAttribute('target', '_blank');
            expect(statusLink).toHaveAttribute('rel', 'noopener noreferrer');
        });

        it('should handle internal links correctly', () => {
            const featuresLink = screen.getByText('Características');
            const pricingLink = screen.getByText('Precios');

            expect(featuresLink).toHaveAttribute('href', '/features');
            expect(pricingLink).toHaveAttribute('href', '/pricing');

            // Internal links should not have target="_blank"
            expect(featuresLink).not.toHaveAttribute('target');
            expect(pricingLink).not.toHaveAttribute('target');
        });
    });

    describe('Copyright Section', () => {
        it('should display current year in copyright', () => {
            const currentYear = new Date().getFullYear();
            expect(screen.getByText(`© ${currentYear} Broslunas Links. Todos los derechos reservados.`)).toBeInTheDocument();
        });

        it('should display copyright bar links', () => {
            // Get all links with "Términos" text (there are two - one in Legal section, one in copyright bar)
            const terminosLinks = screen.getAllByText('Términos');
            const privacidadLinks = screen.getAllByText(/Privacidad/);
            const cookiesLinks = screen.getAllByText(/Cookies/);

            // Check that we have the copyright bar versions
            expect(terminosLinks.length).toBeGreaterThan(0);
            expect(privacidadLinks.length).toBeGreaterThan(0);
            expect(cookiesLinks.length).toBeGreaterThan(0);
        });
    });

    describe('Responsive Design', () => {
        it('should have proper CSS classes for responsive grid', () => {
            const footer = screen.getByRole('contentinfo');
            const gridContainer = footer.querySelector('.grid');

            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('md:grid-cols-2');
            expect(gridContainer).toHaveClass('lg:grid-cols-4');
        });

        it('should have proper spacing and layout classes', () => {
            const footer = screen.getByRole('contentinfo');

            expect(footer).toHaveClass('bg-gray-900');
            expect(footer).toHaveClass('text-white');

            const container = footer.querySelector('.max-w-7xl');
            expect(container).toHaveClass('mx-auto');
            expect(container).toHaveClass('px-4');
            expect(container).toHaveClass('sm:px-6');
            expect(container).toHaveClass('lg:px-8');
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', () => {
            const footer = screen.getByRole('contentinfo');
            expect(footer).toBeInTheDocument();
        });

        it('should have proper heading hierarchy', () => {
            const sectionHeadings = screen.getAllByRole('heading', { level: 3 });
            expect(sectionHeadings).toHaveLength(3); // Producto, Soporte, Legal
        });

        it('should have proper aria-labels for social media links', () => {
            expect(screen.getByLabelText('Twitter')).toBeInTheDocument();
            expect(screen.getByLabelText('GitHub')).toBeInTheDocument();
            expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument();
        });

        it('should have proper list structure for navigation items', () => {
            const lists = screen.getAllByRole('list');
            expect(lists.length).toBeGreaterThan(0);
        });
    });

    describe('Visual Feedback', () => {
        it('should have hover states for links', () => {
            const links = screen.getAllByRole('link');

            links.forEach(link => {
                // Check that links have hover classes
                expect(link).toHaveClass(/hover:/);
            });
        });

        it('should have proper color classes for different link states', () => {
            const navigationLinks = screen.getByText('Características');
            expect(navigationLinks).toHaveClass('text-gray-400');
            expect(navigationLinks).toHaveClass('hover:text-white');
        });
    });
});