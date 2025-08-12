// Simple test script to verify environment variables
console.log('🔍 Testing Environment Variables:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Missing');

// Test MongoDB connection
const { MongoClient } = require('mongodb');

async function testMongoDB() {
    if (!process.env.MONGODB_URI) {
        console.log('❌ Cannot test MongoDB - MONGODB_URI not set');
        return;
    }
    
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ MongoDB connection successful');
        await client.close();
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
    }
}

testMongoDB();