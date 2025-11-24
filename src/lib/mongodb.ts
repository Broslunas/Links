import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Increase server selection timeout to handle slow connections
            serverSelectionTimeoutMS: 10000, // 10 seconds
            // Socket timeout to prevent hanging connections
            socketTimeoutMS: 45000, // 45 seconds
            // Connection pool settings for better performance
            maxPoolSize: 10,
            minPoolSize: 2,
            // Heartbeat to keep connections alive
            heartbeatFrequencyMS: 10000, // 10 seconds
            // Retry writes on network errors
            retryWrites: true,
            // Retry reads on network errors
            retryReads: true,
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts);
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export { connectDB };
export default connectDB;