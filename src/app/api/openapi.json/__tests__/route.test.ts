/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock fs module
jest.mock('fs');
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;

// Mock path module
jest.mock('path');
const mockJoin = join as jest.MockedFunction<typeof join>;

describe('/api/openapi.json', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('serves OpenAPI specification successfully', async () => {
        const mockSpec = {
            openapi: '3.0.3',
            info: { title: 'Test API', version: '1.0.0' },
            servers: [{ url: 'http://example.com/api/v1' }],
            paths: {},
            components: {}
        };

        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));

        const request = new NextRequest('http://localhost:3000/api/openapi.json', {
            headers: {
                'host': 'localhost:3000',
            },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.openapi).toBe('3.0.3');
        expect(data.info.title).toBe('Test API');
        expect(data.servers[0].url).toBe('http://localhost:3000/api/v1');
        expect(data.servers[0].description).toBe('Development server');
    });

    it('updates server URL based on request headers', async () => {
        const mockSpec = {
            openapi: '3.0.3',
            info: { title: 'Test API', version: '1.0.0' },
            servers: [{ url: 'http://example.com/api/v1' }],
            paths: {},
            components: {}
        };

        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));

        const request = new NextRequest('https://api.example.com/api/openapi.json', {
            headers: {
                'host': 'api.example.com',
                'x-forwarded-proto': 'https',
            },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.servers[0].url).toBe('https://api.example.com/api/v1');
    });

    it('handles production environment correctly', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const mockSpec = {
            openapi: '3.0.3',
            info: { title: 'Test API', version: '1.0.0' },
            servers: [],
            paths: {},
            components: {}
        };

        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));

        const request = new NextRequest('https://api.example.com/api/openapi.json', {
            headers: {
                'host': 'api.example.com',
                'x-forwarded-proto': 'https',
            },
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.servers[0].description).toBe('Production server');

        process.env.NODE_ENV = originalEnv;
    });

    it('handles file read error', async () => {
        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockImplementation(() => {
            throw new Error('File not found');
        });

        const request = new NextRequest('http://localhost:3000/api/openapi.json');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to load OpenAPI specification');
    });

    it('handles JSON parse error', async () => {
        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockReturnValue('invalid json');

        const request = new NextRequest('http://localhost:3000/api/openapi.json');

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to load OpenAPI specification');
    });

    it('sets correct cache headers', async () => {
        const mockSpec = {
            openapi: '3.0.3',
            info: { title: 'Test API', version: '1.0.0' },
            servers: [],
            paths: {},
            components: {}
        };

        mockJoin.mockReturnValue('/mock/path/openapi.json');
        mockReadFileSync.mockReturnValue(JSON.stringify(mockSpec));

        const request = new NextRequest('http://localhost:3000/api/openapi.json');

        const response = await GET(request);

        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });
});