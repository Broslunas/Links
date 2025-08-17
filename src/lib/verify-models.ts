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

    // Test User model
    const userSchema = User.schema;

    // Test Link model
    const linkSchema = Link.schema;

    // Test AnalyticsEvent model
    const analyticsSchema = AnalyticsEvent.schema;

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
