// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

import '@testing-library/jest-dom';

// Mock environment variables for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/url-shortener-test';
process.env.IP_HASH_SECRET = 'test-secret-key';