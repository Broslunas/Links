import { NextResponse } from 'next/server';

const API_DOCS = {
    title: 'URL Shortener API',
    version: '1.0.0',
    description: 'Public API for creating and managing short URLs',
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    authentication: {
        type: 'Bearer Token',
        description: 'Include your API token in the Authorization header: Bearer uls_your_token_here',
        note: 'Get your API token from the Settings page after logging in'
    },
    rateLimit: {
        requests: 100,
        window: '1 hour',
        description: 'Rate limit applies per API token'
    },
    endpoints: {
        'POST /api/v1/links': {
            description: 'Create a new short link',
            authentication: 'Required',
            headers: {
                'Authorization': 'Bearer uls_your_token_here',
                'Content-Type': 'application/json'
            },
            body: {
                originalUrl: {
                    type: 'string',
                    required: true,
                    description: 'The URL to shorten'
                },
                slug: {
                    type: 'string',
                    required: false,
                    description: 'Custom slug (optional, auto-generated if not provided)'
                },
                title: {
                    type: 'string',
                    required: false,
                    description: 'Optional title for the link'
                },
                description: {
                    type: 'string',
                    required: false,
                    description: 'Optional description for the link'
                },
                isPublicStats: {
                    type: 'boolean',
                    required: false,
                    default: false,
                    description: 'Whether to make statistics publicly accessible'
                }
            },
            responses: {
                201: {
                    description: 'Link created successfully',
                    example: {
                        success: true,
                        data: {
                            id: '507f1f77bcf86cd799439011',
                            originalUrl: 'https://example.com',
                            slug: 'abc123',
                            shortUrl: 'https://yoursite.com/abc123',
                            title: 'Example Site',
                            description: 'An example website',
                            isPublicStats: false,
                            clickCount: 0,
                            createdAt: '2024-01-01T00:00:00.000Z'
                        }
                    }
                },
                400: {
                    description: 'Invalid request data',
                    example: {
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid URL format'
                        }
                    }
                },
                401: {
                    description: 'Invalid or missing API token',
                    example: {
                        success: false,
                        error: {
                            code: 'UNAUTHORIZED',
                            message: 'Invalid API token'
                        }
                    }
                },
                409: {
                    description: 'Slug already exists',
                    example: {
                        success: false,
                        error: {
                            code: 'SLUG_TAKEN',
                            message: 'Slug already exists',
                            details: {
                                suggestedSlugs: ['abc124', 'abc125', 'abc-xyz']
                            }
                        }
                    }
                },
                429: {
                    description: 'Rate limit exceeded',
                    example: {
                        success: false,
                        error: {
                            code: 'RATE_LIMIT_EXCEEDED',
                            message: 'Too many requests'
                        }
                    }
                }
            }
        },
        'GET /api/v1/links': {
            description: 'Get all links for the authenticated user',
            authentication: 'Required',
            headers: {
                'Authorization': 'Bearer uls_your_token_here'
            },
            parameters: {
                page: {
                    type: 'number',
                    required: false,
                    default: 1,
                    description: 'Page number for pagination'
                },
                limit: {
                    type: 'number',
                    required: false,
                    default: 50,
                    max: 100,
                    description: 'Number of links per page'
                }
            },
            responses: {
                200: {
                    description: 'Links retrieved successfully',
                    example: {
                        success: true,
                        data: {
                            links: [
                                {
                                    id: '507f1f77bcf86cd799439011',
                                    originalUrl: 'https://example.com',
                                    slug: 'abc123',
                                    shortUrl: 'https://yoursite.com/abc123',
                                    title: 'Example Site',
                                    clickCount: 42,
                                    createdAt: '2024-01-01T00:00:00.000Z'
                                }
                            ],
                            pagination: {
                                page: 1,
                                limit: 50,
                                total: 1,
                                totalPages: 1
                            }
                        }
                    }
                }
            }
        },
        'GET /api/v1/links/{id}/stats': {
            description: 'Get statistics for a specific link',
            authentication: 'Required',
            headers: {
                'Authorization': 'Bearer uls_your_token_here'
            },
            parameters: {
                id: {
                    type: 'string',
                    required: true,
                    description: 'Link ID'
                },
                startDate: {
                    type: 'string',
                    required: false,
                    format: 'YYYY-MM-DD',
                    description: 'Start date for statistics (optional)'
                },
                endDate: {
                    type: 'string',
                    required: false,
                    format: 'YYYY-MM-DD',
                    description: 'End date for statistics (optional)'
                }
            },
            responses: {
                200: {
                    description: 'Statistics retrieved successfully',
                    example: {
                        success: true,
                        data: {
                            totalClicks: 42,
                            uniqueClicks: 38,
                            clicksByDay: [
                                { date: '2024-01-01', clicks: 5 },
                                { date: '2024-01-02', clicks: 8 }
                            ],
                            clicksByCountry: [
                                { country: 'US', clicks: 20 },
                                { country: 'UK', clicks: 15 }
                            ],
                            clicksByDevice: [
                                { device: 'mobile', clicks: 25 },
                                { device: 'desktop', clicks: 17 }
                            ]
                        }
                    }
                },
                404: {
                    description: 'Link not found or not owned by user',
                    example: {
                        success: false,
                        error: {
                            code: 'NOT_FOUND',
                            message: 'Link not found'
                        }
                    }
                }
            }
        }
    },
    examples: {
        curl: {
            createLink: `curl -X POST ${process.env.NEXTAUTH_URL || 'https://yoursite.com'}/api/v1/links \\
  -H "Authorization: Bearer uls_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "originalUrl": "https://example.com",
    "slug": "my-link",
    "title": "My Example Link"
  }'`,
            getLinks: `curl -X GET ${process.env.NEXTAUTH_URL || 'https://yoursite.com'}/api/v1/links \\
  -H "Authorization: Bearer uls_your_token_here"`,
            getStats: `curl -X GET ${process.env.NEXTAUTH_URL || 'https://yoursite.com'}/api/v1/links/507f1f77bcf86cd799439011/stats \\
  -H "Authorization: Bearer uls_your_token_here"`
        }
    }
};

export async function GET() {
    return NextResponse.json(API_DOCS, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
    });
}