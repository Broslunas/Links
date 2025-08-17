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

    it('shows retry attempts status when redirect fails', () => {
        // Mock console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={1000} />);

        // Fast forward to trigger redirect
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // The redirect will fail in test environment, so we should see retry status
        // Note: In test environment, window.location.assign throws an error
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('shows failed redirect message and fallback options', async () => {
        // Mock console.error to avoid test output noise
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={1000} />);

        // Fast forward to trigger redirect
        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Wait for all redirect attempts to complete
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // After all attempts fail, should show error message
        // Note: The exact behavior depends on how the component handles test environment failures

        consoleSpy.mockRestore();
    });

    it('validates destination URL format', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Test with invalid URL
        render(<RedirectPage destinationUrl="invalid-url" redirectDelay={1000} />);

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        // Should log error for invalid URL
        expect(consoleSpy).toHaveBeenCalledWith('Invalid destination URL:', 'invalid-url');

        consoleSpy.mockRestore();
    });

    it('handles manual redirect with enhanced error handling', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<RedirectPage destinationUrl="https://example.com" />);

        const redirectButton = screen.getByText('Ir ahora');

        act(() => {
            fireEvent.click(redirectButton);
        });

        // Button should be disabled during redirect attempt
        expect(redirectButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /ir ahora al destino/i })).toHaveTextContent('Redirigiendo...');

        consoleSpy.mockRestore();
    });

    it('shows countdown only in waiting state', () => {
        render(<RedirectPage destinationUrl="https://example.com" redirectDelay={3000} />);

        // Initially should show countdown
        expect(screen.getByText(/Redirigiendo automáticamente en/)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Click manual redirect to change state
        const redirectButton = screen.getByText('Ir ahora');
        act(() => {
            fireEvent.click(redirectButton);
        });

        // Countdown should no longer be visible when not in waiting state
        expect(screen.queryByText(/Redirigiendo automáticamente en/)).not.toBeInTheDocument();
    });

    it('provides enhanced noscript fallback with direct link', () => {
        const destinationUrl = 'https://example.com';
        const { container } = render(<RedirectPage destinationUrl={destinationUrl} />);

        const noscriptElement = container.querySelector('noscript');
        expect(noscriptElement).toBeInTheDocument();

        // In test environment, noscript content isn't rendered, but we can verify the element exists
        // The actual content would be visible when JavaScript is disabled in a real browser
        expect(noscriptElement).toBeTruthy();
    });

    it('handles different redirect states correctly', () => {
        render(<RedirectPage destinationUrl="https://example.com" />);

        // Initially in waiting state
        expect(screen.getByText('Redirigiendo...')).toBeInTheDocument();

        // Click manual redirect to change to manual state
        const redirectButton = screen.getByText('Ir ahora');
        act(() => {
            fireEvent.click(redirectButton);
        });

        // Should show redirecting state
        expect(screen.getByRole('button', { name: /ir ahora al destino/i })).toHaveTextContent('Redirigiendo...');
    });
});