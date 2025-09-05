// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

require('@testing-library/jest-dom');

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/url-shortener-test';
process.env.IP_HASH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Polyfill for Node.js globals in test environment
if (typeof global.Request === 'undefined') {
    global.Request = class Request {
        constructor(input, init) {
            this.url = input;
            this.method = init?.method || 'GET';
            this.headers = new Map(Object.entries(init?.headers || {}));
            this.body = init?.body;
        }

        async json() {
            return JSON.parse(this.body);
        }

        get(name) {
            return this.headers.get(name);
        }
    };
}

if (typeof global.Response === 'undefined') {
    global.Response = class Response {
        constructor(body, init) {
            this.body = body;
            this.status = init?.status || 200;
            this.headers = new Map(Object.entries(init?.headers || {}));
        }

        async json() {
            return JSON.parse(this.body);
        }
    };
}

// Mock NextRequest for API route testing
global.NextRequest = class NextRequest extends global.Request {
    constructor(input, init) {
        super(input, init);
        this.nextUrl = new URL(input);
    }

    get headers() {
        return {
            get: (name) => this._headers?.get(name) || null,
        };
    }
};