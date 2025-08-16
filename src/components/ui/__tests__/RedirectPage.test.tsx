import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RedirectPage } from '../RedirectPage';

// Mock timers
jest.useFakeTimers();

describe('RedirectPage', () => {
    beforeEach(() => {
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    it('renders redirect message with destination URL', () => {
        const destinationUrl = 'https://example.com';
        render(<RedirectPage destinationUrl={destinationUrl} />);

        expect(screen.getByText('Estás siendo redirigido')).toBeInTheDocument();
        expect(screen.getByText('Serás redirigido a:')).toBeInTheDocument();
        expect(screen.getByText(destinationUrl)).toBeInTheDocument();
    });

    it('renders custom title when provided', () => {
        const customTitle = 'Custom Redirect Title';
        render(
            <RedirectPage
                destinationUrl="https://example.com"
                title={customTitle}
            />
        );

        expect(screen.getByText(customTitle)).toBeInTheDocument();
    });

    it('displays loading spinner', () => {
        render(<RedirectPage destinationUrl="https://example.com" />);

        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
        expect(screen.getByText('Redirigiendo...')).toBeInTheDocument();
    });

    it('shows countdown timer', () => {
        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={3000} />);

        expect(screen.getByText(/Redirigiendo automáticamente en/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText(/segundos/)).toBeInTheDocument();
    });

    it('updates countdown every second', () => {
        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={3000} />);

        expect(screen.getByText('3')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText('2')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('disables button after manual redirect', () => {
        render(<RedirectPage destinationUrl="https://example.com" />);

        const redirectButton = screen.getByText('Ir ahora');
        fireEvent.click(redirectButton);

        expect(redirectButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /ir ahora al destino/i })).toHaveTextContent('Redirigiendo...');
    });

    it('truncates long URLs correctly', () => {
        const longUrl = 'https://very-long-domain-name-example.com/very/long/path/with/many/segments/and/parameters?param1=value1&param2=value2&param3=value3';
        render(<RedirectPage destinationUrl={longUrl} />);

        const urlElement = screen.getByTitle(longUrl);
        expect(urlElement.textContent).toContain('...');
        expect(urlElement.textContent!.length).toBeLessThan(longUrl.length);
    });

    it('handles URLs that cannot be parsed', () => {
        const invalidUrl = 'not-a-valid-url-but-still-needs-truncation-because-it-is-very-long-and-exceeds-the-maximum-length-limit';
        render(<RedirectPage destinationUrl={invalidUrl} />);

        const urlElement = screen.getByTitle(invalidUrl);
        expect(urlElement.textContent).toContain('...');
    });

    it('does not truncate short URLs', () => {
        const shortUrl = 'https://short.com';
        render(<RedirectPage destinationUrl={shortUrl} />);

        expect(screen.getByText(shortUrl)).toBeInTheDocument();
    });

    it('uses custom redirect delay', () => {
        const customDelay = 5000;
        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={customDelay} />);

        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/segundos/)).toBeInTheDocument();
    });

    it('provides proper accessibility attributes', () => {
        const destinationUrl = 'https://example.com';
        render(<RedirectPage destinationUrl={destinationUrl} />);

        const urlElement = screen.getByLabelText(`Destino: ${destinationUrl}`);
        expect(urlElement).toBeInTheDocument();

        const redirectButton = screen.getByLabelText('Ir ahora al destino');
        expect(redirectButton).toBeInTheDocument();
    });

    it('shows noscript fallback', () => {
        const destinationUrl = 'https://example.com';
        const { container } = render(<RedirectPage destinationUrl={destinationUrl} />);

        const noscriptElement = container.querySelector('noscript');
        expect(noscriptElement).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const customClass = 'custom-redirect-class';
        const { container } = render(
            <RedirectPage destinationUrl="https://example.com" className={customClass} />
        );

        expect(container.firstChild).toHaveClass(customClass);
    });
});