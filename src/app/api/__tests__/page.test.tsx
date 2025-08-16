import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import ApiDocumentationPage from '../page';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock dynamic import for SwaggerUI
jest.mock('next/dynamic', () => {
    return function mockDynamic(importFunc: any, options: any) {
        const MockSwaggerUI = () => <div data-testid="swagger-ui">Swagger UI Component</div>;
        return MockSwaggerUI;
    };
});

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock sonner toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('ApiDocumentationPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock OpenAPI spec fetch
        mockFetch.mockImplementation((url) => {
            if (url === '/api/openapi.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        openapi: '3.0.3',
                        info: { title: 'Test API', version: '1.0.0' },
                        paths: {},
                        components: {}
                    }),
                } as Response);
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    it('renders loading state initially', () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'loading',
        });

        render(<ApiDocumentationPage />);

        // Check for loading spinner
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders documentation page for unauthenticated user', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        render(<ApiDocumentationPage />);

        await waitFor(() => {
            expect(screen.getByText('API Documentation')).toBeInTheDocument();
        });

        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText(/sign in/)).toBeInTheDocument();
    });

    it('renders documentation page for authenticated user without token', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { id: '1', email: 'test@example.com' } },
            status: 'authenticated',
        });

        // Mock user token fetch
        mockFetch.mockImplementation((url) => {
            if (url === '/api/openapi.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        openapi: '3.0.3',
                        info: { title: 'Test API', version: '1.0.0' },
                        paths: {},
                        components: {}
                    }),
                } as Response);
            }
            if (url === '/api/user/token') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { isActive: false }
                    }),
                } as Response);
            }
            return Promise.reject(new Error('Not found'));
        });

        render(<ApiDocumentationPage />);

        await waitFor(() => {
            expect(screen.getByText('API Documentation')).toBeInTheDocument();
        });

        expect(screen.getByText('No API token found. Generate one to start testing the API.')).toBeInTheDocument();
        expect(screen.getByText('Generate API Token')).toBeInTheDocument();
    });

    it('renders documentation page for authenticated user with active token', async () => {
        mockUseSession.mockReturnValue({
            data: { user: { id: '1', email: 'test@example.com' } },
            status: 'authenticated',
        });

        // Mock user token fetch
        mockFetch.mockImplementation((url) => {
            if (url === '/api/openapi.json') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        openapi: '3.0.3',
                        info: { title: 'Test API', version: '1.0.0' },
                        paths: {},
                        components: {}
                    }),
                } as Response);
            }
            if (url === '/api/user/token') {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: {
                            isActive: true,
                            tokenPreview: 'uls_abc...xyz'
                        }
                    }),
                } as Response);
            }
            return Promise.reject(new Error('Not found'));
        });

        render(<ApiDocumentationPage />);

        await waitFor(() => {
            expect(screen.getByText('API Documentation')).toBeInTheDocument();
        });

        expect(screen.getByText(/API Token Active: uls_abc\.\.\.xyz/)).toBeInTheDocument();
        expect(screen.getByText('Regenerate Token')).toBeInTheDocument();
        expect(screen.getByText('Revoke Token')).toBeInTheDocument();
    });

    it('displays getting started section with best practices', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        render(<ApiDocumentationPage />);

        await waitFor(() => {
            expect(screen.getByText('Getting Started')).toBeInTheDocument();
        });

        expect(screen.getAllByText('Authentication')).toHaveLength(2); // One in auth section, one in getting started
        expect(screen.getByText('Rate Limits')).toBeInTheDocument();
        expect(screen.getByText('Response Format')).toBeInTheDocument();
        expect(screen.getByText('Best Practices')).toBeInTheDocument();
    });

    it('renders Swagger UI component', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        render(<ApiDocumentationPage />);

        await waitFor(() => {
            expect(screen.getByTestId('swagger-ui')).toBeInTheDocument();
        });
    });

    it('handles OpenAPI spec loading error', async () => {
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
        });

        // Mock fetch to fail
        mockFetch.mockRejectedValue(new Error('Network error'));

        render(<ApiDocumentationPage />);

        // Should show loading state indefinitely when spec fails to load
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
});