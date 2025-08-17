import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiTokenManager } from '../ApiTokenManager';
import { useToast } from '../../../hooks/useToast';

// Mock the useToast hook
jest.mock('../../../hooks/useToast');
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

describe('ApiTokenManager', () => {
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
        mockAddToast.mockClear();
        mockRemoveToast.mockClear();
        mockWarning.mockClear();
        mockInfo.mockClear();
        (navigator.clipboard.writeText as jest.Mock).mockClear();
    });

    describe('Loading State', () => {
        it('shows loading spinner while fetching token info', () => {
            mockFetch.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<ApiTokenManager />);

            expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
        });
    });

    describe('No Token State', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        hasToken: false,
                    },
                }),
            } as Response);
        });

        it('renders no token state correctly', async () => {
            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByText('No tienes un token de API')).toBeInTheDocument();
            });

            expect(screen.getByText('Genera un token para comenzar a usar la API pública.')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /generar token/i })).toBeInTheDocument();
        });

        it('generates new token when generate button is clicked', async () => {
            const newToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { hasToken: false },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            token: newToken,
                            createdAt: new Date().toISOString(),
                            message: 'API token generated successfully',
                        },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            hasToken: true,
                            tokenPreview: 'uls_...cdef',
                            createdAt: new Date().toISOString(),
                        },
                    }),
                } as Response);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /generar token/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /generar token/i }));

            // Wait for the new token modal to appear
            await waitFor(() => {
                expect(screen.getByText('¡Token Generado!')).toBeInTheDocument();
            }, { timeout: 3000 });

            expect(screen.getByDisplayValue(newToken)).toBeInTheDocument();
            expect(mockSuccess).toHaveBeenCalledWith('API token generated successfully', 'Token API');
        });
    });

    describe('Existing Token State', () => {
        const mockTokenInfo = {
            hasToken: true,
            tokenPreview: 'uls_...cdef',
            createdAt: '2024-01-15T10:30:00Z',
            lastUsedAt: '2024-01-16T14:20:00Z',
        };

        beforeEach(() => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: mockTokenInfo,
                }),
            } as Response);
        });

        it('renders existing token state correctly', async () => {
            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByText('Token Actual')).toBeInTheDocument();
            });

            expect(screen.getByText('uls_...cdef')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /regenerar/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /revocar/i })).toBeInTheDocument();
            expect(screen.getByText('Cómo usar tu token')).toBeInTheDocument();
        });

        it('formats dates correctly', async () => {
            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByText('Token Actual')).toBeInTheDocument();
            });

            // Check that dates are formatted (exact format may vary by locale)
            expect(screen.getByText(/15 ene 2024/i)).toBeInTheDocument();
            expect(screen.getByText(/16 ene 2024/i)).toBeInTheDocument();
        });

        it('shows confirmation modal when revoke is clicked', async () => {
            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /revocar/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /revocar/i }));

            await waitFor(() => {
                expect(screen.getByText('Revocar Token de API')).toBeInTheDocument();
            });

            expect(screen.getByText(/todas las aplicaciones que lo usen dejarán de funcionar/i)).toBeInTheDocument();
        });

        it('shows confirmation modal when regenerate is clicked', async () => {
            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /regenerar/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /regenerar/i }));

            await waitFor(() => {
                expect(screen.getByText('Regenerar Token de API')).toBeInTheDocument();
            });

            expect(screen.getByText(/el token actual dejará de funcionar/i)).toBeInTheDocument();
        });

        it('revokes token when confirmed', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: mockTokenInfo,
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            message: 'API token revoked successfully',
                        },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            hasToken: false,
                        },
                    }),
                } as Response);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /revocar/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /revocar/i }));

            await waitFor(() => {
                expect(screen.getByText('Revocar Token de API')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /revocar token/i }));

            await waitFor(() => {
                expect(mockSuccess).toHaveBeenCalledWith('API token revoked successfully', 'Token API');
            });
        });
    });

    describe('New Token Modal', () => {
        it('copies token to clipboard when copy button is clicked', async () => {
            const newToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { hasToken: false },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            token: newToken,
                            createdAt: new Date().toISOString(),
                            message: 'API token generated successfully',
                        },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            hasToken: true,
                            tokenPreview: 'uls_...cdef',
                            createdAt: new Date().toISOString(),
                        },
                    }),
                } as Response);

            (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /generar token/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /generar token/i }));

            await waitFor(() => {
                expect(screen.getByText('¡Token Generado!')).toBeInTheDocument();
            }, { timeout: 3000 });

            fireEvent.click(screen.getByRole('button', { name: /copiar/i }));

            await waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(newToken);
                expect(mockSuccess).toHaveBeenCalledWith('Token copiado al portapapeles', 'Copiado');
            });
        });

        it('closes modal when understood button is clicked', async () => {
            const newToken = 'uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { hasToken: false },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            token: newToken,
                            createdAt: new Date().toISOString(),
                            message: 'API token generated successfully',
                        },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: {
                            hasToken: true,
                            tokenPreview: 'uls_...cdef',
                            createdAt: new Date().toISOString(),
                        },
                    }),
                } as Response);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /generar token/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /generar token/i }));

            await waitFor(() => {
                expect(screen.getByText('¡Token Generado!')).toBeInTheDocument();
            }, { timeout: 3000 });

            fireEvent.click(screen.getByRole('button', { name: /entendido/i }));

            await waitFor(() => {
                expect(screen.queryByText('¡Token Generado!')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('handles API errors when loading token info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                }),
            } as Response);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(mockError).toHaveBeenCalledWith('Error al cargar información del token', 'Error');
            });
        });

        it('handles network errors when loading token info', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(mockError).toHaveBeenCalledWith('Error al cargar información del token', 'Error');
            });
        });

        it('handles API errors when generating token', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { hasToken: false },
                    }),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({
                        success: false,
                        error: {
                            code: 'TOKEN_GENERATION_FAILED',
                            message: 'Failed to generate unique token',
                        },
                    }),
                } as Response);

            render(<ApiTokenManager />);

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /generar token/i })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole('button', { name: /generar token/i }));

            await waitFor(() => {
                expect(mockError).toHaveBeenCalledWith('Failed to generate unique token', 'Error');
            });
        });
    });
});