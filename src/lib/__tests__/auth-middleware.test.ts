/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authenticateRequest, verifyResourceOwnership, verifyApiResourceOwnership, verifyLinkOwnership, verifyLinkOwnershipBySlug, withAuth } from '../auth-middleware';
import { validateApiToken, updateTokenLastUsed } from '../api-token';
import { validateUserSession } from '../user-utils';
import { AppError, ErrorCode } from '../api-errors';
import Link from '../../models/Link';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../api-token');
jest.mock('../user-utils');
jest.mock('../../models/Link');

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockValidateApiToken = validateApiToken as jest.MockedFunction<typeof validateApiToken>;
const mockUpdateTokenLastUsed = updateTokenLastUsed as jest.MockedFunction<typeof updateTokenLastUsed>;
const mockValidateUserSession = validateUserSession as jest.MockedFunction<typeof validateUserSession>;
const mockLink = Link as jest.MockedClass<typeof Link>;

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('authenticateRequest', () => {
        it('should authenticate with valid API token', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const
            };

            mockValidateApiToken.mockResolvedValue(mockUser as any);
            mockUpdateTokenLastUsed.mockResolvedValue();

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                }
            });

            const result = await authenticateRequest(request);

            expect(mockValidateApiToken).toHaveBeenCalledWith('uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
            expect(mockUpdateTokenLastUsed).toHaveBeenCalledWith('user123');
            expect(result).toEqual({
                userId: 'user123',
                user: {
                    id: 'user123',
                    email: 'test@example.com',
                    name: 'Test User',
                    provider: 'github'
                },
                authMethod: 'api_token'
            });
        });

        it('should throw error for invalid API token', async () => {
            mockValidateApiToken.mockResolvedValue(null);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer invalid_token'
                }
            });

            await expect(authenticateRequest(request)).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.INVALID_TOKEN,
                    message: 'Invalid API token',
                    statusCode: 401
                })
            );

            expect(mockUpdateTokenLastUsed).not.toHaveBeenCalled();
        });

        it('should authenticate with valid session when no API token', async () => {
            const mockSession = {
                user: {
                    id: 'user456',
                    email: 'session@example.com',
                    name: 'Session User',
                    provider: 'google'
                }
            };

            mockGetServerSession.mockResolvedValue(mockSession as any);
            mockValidateUserSession.mockReturnValue({
                isValid: true,
                userId: 'user456'
            });

            const request = new NextRequest('http://localhost/api/test');

            const result = await authenticateRequest(request);

            expect(mockValidateApiToken).not.toHaveBeenCalled();
            expect(mockUpdateTokenLastUsed).not.toHaveBeenCalled();
            expect(result).toEqual({
                userId: 'user456',
                user: {
                    id: 'user456',
                    email: 'session@example.com',
                    name: 'Session User',
                    provider: 'google'
                },
                authMethod: 'session'
            });
        });

        it('should throw error when no valid authentication', async () => {
            mockGetServerSession.mockResolvedValue(null);
            mockValidateUserSession.mockReturnValue({
                isValid: false,
                userId: null
            });

            const request = new NextRequest('http://localhost/api/test');

            await expect(authenticateRequest(request)).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.UNAUTHORIZED,
                    message: 'Authentication required',
                    statusCode: 401
                })
            );
        });

        it('should prioritize API token over session', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'token@example.com',
                name: 'Token User',
                provider: 'github' as const
            };

            const mockSession = {
                user: {
                    id: 'user456',
                    email: 'session@example.com',
                    name: 'Session User'
                }
            };

            mockValidateApiToken.mockResolvedValue(mockUser as any);
            mockUpdateTokenLastUsed.mockResolvedValue();
            mockGetServerSession.mockResolvedValue(mockSession as any);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                }
            });

            const result = await authenticateRequest(request);

            expect(mockValidateApiToken).toHaveBeenCalled();
            expect(mockGetServerSession).not.toHaveBeenCalled();
            expect(result.authMethod).toBe('api_token');
            expect(result.userId).toBe('user123');
        });

        it('should handle malformed Bearer token', async () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer'
                }
            });

            mockGetServerSession.mockResolvedValue(null);
            mockValidateUserSession.mockReturnValue({
                isValid: false,
                userId: null
            });

            await expect(authenticateRequest(request)).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.UNAUTHORIZED,
                    message: 'Authentication required',
                    statusCode: 401
                })
            );
        });

        it('should handle non-Bearer authorization header', async () => {
            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Basic dGVzdDp0ZXN0'
                }
            });

            mockGetServerSession.mockResolvedValue(null);
            mockValidateUserSession.mockReturnValue({
                isValid: false,
                userId: null
            });

            await expect(authenticateRequest(request)).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.UNAUTHORIZED,
                    message: 'Authentication required',
                    statusCode: 401
                })
            );
        });
    });

    describe('verifyResourceOwnership', () => {
        it('should pass when user owns resource', () => {
            expect(() => {
                verifyResourceOwnership('user123', 'user123');
            }).not.toThrow();
        });

        it('should throw error when user does not own resource', () => {
            expect(() => {
                verifyResourceOwnership('user123', 'user456');
            }).toThrow(
                expect.objectContaining({
                    code: ErrorCode.FORBIDDEN,
                    message: 'Access denied: You can only access your own resources',
                    statusCode: 403
                })
            );
        });
    });

    describe('verifyApiResourceOwnership', () => {
        it('should pass when user owns API resource', () => {
            expect(() => {
                verifyApiResourceOwnership('user123', 'user123');
            }).not.toThrow();
        });

        it('should throw error when user does not own API resource', () => {
            expect(() => {
                verifyApiResourceOwnership('user123', 'user456');
            }).toThrow(
                expect.objectContaining({
                    code: ErrorCode.FORBIDDEN,
                    message: 'Access denied: You can only access your own resources through the API',
                    statusCode: 403
                })
            );
        });
    });

    describe('withAuth wrapper', () => {
        it('should call handler with auth context when authentication succeeds', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const
            };

            mockValidateApiToken.mockResolvedValue(mockUser as any);
            mockUpdateTokenLastUsed.mockResolvedValue();

            const mockHandler = jest.fn().mockResolvedValue(new Response('success'));
            const wrappedHandler = withAuth(mockHandler);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                }
            });

            const response = await wrappedHandler(request);

            expect(mockHandler).toHaveBeenCalledWith(
                request,
                expect.objectContaining({
                    userId: 'user123',
                    authMethod: 'api_token'
                })
            );
            expect(response).toBeInstanceOf(Response);
            expect(await response.text()).toBe('success');
        });

        it('should return error response when authentication fails', async () => {
            mockValidateApiToken.mockResolvedValue(null);

            const mockHandler = jest.fn();
            const wrappedHandler = withAuth(mockHandler);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer invalid_token'
                }
            });

            const response = await wrappedHandler(request);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(response.status).toBe(401);

            const responseData = await response.json();
            expect(responseData).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.INVALID_TOKEN,
                    message: 'Token de autenticación inválido'
                }
            });
        });

        it('should handle unexpected errors in handler', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const
            };

            mockValidateApiToken.mockResolvedValue(mockUser as any);
            mockUpdateTokenLastUsed.mockResolvedValue();

            const mockHandler = jest.fn().mockRejectedValue(new Error('Unexpected error'));
            const wrappedHandler = withAuth(mockHandler);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                }
            });

            const response = await wrappedHandler(request);

            expect(response.status).toBe(500);

            const responseData = await response.json();
            expect(responseData).toMatchObject({
                success: false,
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'Error interno del servidor. Inténtalo más tarde'
                }
            });
        });

        it('should pass additional arguments to handler', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                name: 'Test User',
                provider: 'github' as const
            };

            mockValidateApiToken.mockResolvedValue(mockUser as any);
            mockUpdateTokenLastUsed.mockResolvedValue();

            const mockHandler = jest.fn().mockResolvedValue(new Response('success'));
            const wrappedHandler = withAuth(mockHandler);

            const request = new NextRequest('http://localhost/api/test', {
                headers: {
                    'authorization': 'Bearer uls_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
                }
            });

            const additionalArg = { params: { id: '123' } };
            await wrappedHandler(request, additionalArg);

            expect(mockHandler).toHaveBeenCalledWith(
                request,
                expect.objectContaining({
                    userId: 'user123',
                    authMethod: 'api_token'
                }),
                additionalArg
            );
        });
    });
}); describe
    ('verifyLinkOwnership', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should pass when user owns the link', async () => {
            const mockLinkDoc = {
                _id: 'link123',
                userId: { toString: () => 'user123' },
                slug: 'test-link',
                originalUrl: 'https://example.com'
            };

            mockLink.findById = jest.fn().mockResolvedValue(mockLinkDoc);

            await expect(verifyLinkOwnership('user123', 'link123')).resolves.not.toThrow();
            expect(mockLink.findById).toHaveBeenCalledWith('link123');
        });

        it('should throw error when link not found', async () => {
            mockLink.findById = jest.fn().mockResolvedValue(null);

            await expect(verifyLinkOwnership('user123', 'link123')).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.LINK_NOT_FOUND,
                    message: 'Link not found',
                    statusCode: 404
                })
            );
        });

        it('should throw error when user does not own the link', async () => {
            const mockLinkDoc = {
                _id: 'link123',
                userId: { toString: () => 'user456' },
                slug: 'test-link',
                originalUrl: 'https://example.com'
            };

            mockLink.findById = jest.fn().mockResolvedValue(mockLinkDoc);

            await expect(verifyLinkOwnership('user123', 'link123')).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.FORBIDDEN,
                    message: 'Access denied: You can only access your own links',
                    statusCode: 403
                })
            );
        });

        it('should throw error for invalid link ID format', async () => {
            const castError = new Error('Cast to ObjectId failed');
            castError.name = 'CastError';
            mockLink.findById = jest.fn().mockRejectedValue(castError);

            await expect(verifyLinkOwnership('user123', 'invalid-id')).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.LINK_NOT_FOUND,
                    message: 'Invalid link ID format',
                    statusCode: 404
                })
            );
        });

        it('should throw database error for unexpected errors', async () => {
            mockLink.findById = jest.fn().mockRejectedValue(new Error('Database connection failed'));

            await expect(verifyLinkOwnership('user123', 'link123')).rejects.toThrow(
                expect.objectContaining({
                    code: ErrorCode.DATABASE_ERROR,
                    message: 'Error verifying link ownership',
                    statusCode: 500
                })
            );
        });
    });

describe('verifyLinkOwnershipBySlug', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pass when user owns the link by slug', async () => {
        const mockLinkDoc = {
            _id: 'link123',
            userId: { toString: () => 'user123' },
            slug: 'test-link',
            originalUrl: 'https://example.com'
        };

        mockLink.findOne = jest.fn().mockResolvedValue(mockLinkDoc);

        await expect(verifyLinkOwnershipBySlug('user123', 'test-link')).resolves.not.toThrow();
        expect(mockLink.findOne).toHaveBeenCalledWith({ slug: 'test-link' });
    });

    it('should throw error when link not found by slug', async () => {
        mockLink.findOne = jest.fn().mockResolvedValue(null);

        await expect(verifyLinkOwnershipBySlug('user123', 'nonexistent-link')).rejects.toThrow(
            expect.objectContaining({
                code: ErrorCode.LINK_NOT_FOUND,
                message: "Link with slug 'nonexistent-link' not found",
                statusCode: 404
            })
        );
    });

    it('should throw error when user does not own the link by slug', async () => {
        const mockLinkDoc = {
            _id: 'link123',
            userId: { toString: () => 'user456' },
            slug: 'test-link',
            originalUrl: 'https://example.com'
        };

        mockLink.findOne = jest.fn().mockResolvedValue(mockLinkDoc);

        await expect(verifyLinkOwnershipBySlug('user123', 'test-link')).rejects.toThrow(
            expect.objectContaining({
                code: ErrorCode.FORBIDDEN,
                message: 'Access denied: You can only access your own links',
                statusCode: 403
            })
        );
    });

    it('should throw database error for unexpected errors', async () => {
        mockLink.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

        await expect(verifyLinkOwnershipBySlug('user123', 'test-link')).rejects.toThrow(
            expect.objectContaining({
                code: ErrorCode.DATABASE_ERROR,
                message: 'Error verifying link ownership',
                statusCode: 500
            })
        );
    });
});