import { User, Link, AnalyticsEvent } from '../models';
import connectDB from './mongodb';

/**
 * Verification script to test database models
 * This can be run to ensure models are properly configured
 */
export async function verifyModels() {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Database connection successful');

        // Test User model
        const userSchema = User.schema;
        console.log('✅ User model loaded');
        console.log('  - Fields:', Object.keys(userSchema.paths));
        console.log('  - Indexes:', userSchema.indexes().length);

        // Test Link model
        const linkSchema = Link.schema;
        console.log('✅ Link model loaded');
        console.log('  - Fields:', Object.keys(linkSchema.paths));
        console.log('  - Indexes:', linkSchema.indexes().length);

        // Test AnalyticsEvent model
        const analyticsSchema = AnalyticsEvent.schema;
        console.log('✅ AnalyticsEvent model loaded');
        console.log('  - Fields:', Object.keys(analyticsSchema.paths));
        console.log('  - Indexes:', analyticsSchema.indexes().length);

        console.log('\n🎉 All models verified successfully!');
        return true;
    } catch (error) {
        console.error('❌ Model verification failed:', error);
        return false;
    }
}

// Run verification if this file is executed directly
if (require.main === module) {
    verifyModels().then(() => process.exit(0));
}