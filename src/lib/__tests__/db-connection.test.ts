import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import connectDB from '../mongodb';
import { User, Link, AnalyticsEvent } from '../../models';

// Mock environment variable for testing
process.env.MONGODB_URI = 'mongodb://localhost:27017/url-shortener-test';

describe('Database Connection and Models', () => {
    beforeAll(async () => {
        // Connect to test database
        await connectDB();
    });

    afterAll(async () => {
        // Clean up and close connection
        await mongoose.connection.close();
    });

    it('should connect to MongoDB successfully', async () => {
        const connection = await connectDB();
        expect(connection).toBeDefined();
        expect(mongoose.connection.readyState).toBe(1); // Connected
    });

    it('should create User model with correct schema', () => {
        expect(User.schema.paths.email).toBeDefined();
        expect(User.schema.paths.name).toBeDefined();
        expect(User.schema.paths.provider).toBeDefined();
        expect(User.schema.paths.providerId).toBeDefined();
    });

    it('should create Link model with correct schema', () => {
        expect(Link.schema.paths.userId).toBeDefined();
        expect(Link.schema.paths.originalUrl).toBeDefined();
        expect(Link.schema.paths.slug).toBeDefined();
        expect(Link.schema.paths.isPublicStats).toBeDefined();
        expect(Link.schema.paths.clickCount).toBeDefined();
    });

    it('should create AnalyticsEvent model with correct schema', () => {
        expect(AnalyticsEvent.schema.paths.linkId).toBeDefined();
        expect(AnalyticsEvent.schema.paths.timestamp).toBeDefined();
        expect(AnalyticsEvent.schema.paths.country).toBeDefined();
        expect(AnalyticsEvent.schema.paths.device).toBeDefined();
    });

    it('should have proper indexes defined', () => {
        const userIndexes = User.schema.indexes();
        const linkIndexes = Link.schema.indexes();
        const analyticsIndexes = AnalyticsEvent.schema.indexes();

        expect(userIndexes.length).toBeGreaterThan(0);
        expect(linkIndexes.length).toBeGreaterThan(0);
        expect(analyticsIndexes.length).toBeGreaterThan(0);
    });
});