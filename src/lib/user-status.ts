import { connectDB } from './db-utils';
import User from '../models/User';

/**
 * Check if a user is active/not blocked
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user is active, false if blocked or not found
 */
export async function isUserActive(userId: string): Promise<boolean> {
    try {
        await connectDB();
        const user = await User.findById(userId).select('isActive');
        return user ? (user.isActive ?? true) : false;
    } catch (error) {
        console.error('Error checking user status:', error);
        return false; // Fail safely by considering user as inactive
    }
}

/**
 * Check if a user is active by email
 * @param email - The user email to check
 * @returns Promise<boolean> - true if user is active, false if blocked or not found
 */
export async function isUserActiveByEmail(email: string): Promise<boolean> {
    try {
        await connectDB();
        const user = await User.findOne({ email }).select('isActive');
        return user ? (user.isActive ?? true) : false;
    } catch (error) {
        console.error('Error checking user status by email:', error);
        return false; // Fail safely by considering user as inactive
    }
}

/**
 * Block/unblock a user (admin function)
 * @param userId - The user ID to block/unblock
 * @param isActive - true to activate, false to block
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function setUserActiveStatus(userId: string, isActive: boolean): Promise<boolean> {
    try {
        await connectDB();
        const result = await User.findByIdAndUpdate(
            userId,
            { isActive },
            { new: true }
        );
        return !!result;
    } catch (error) {
        console.error('Error updating user status:', error);
        return false;
    }
}

/**
 * Get user status information
 * @param userId - The user ID to check
 * @returns Promise<{isActive: boolean, user: any} | null>
 */
export async function getUserStatus(userId: string): Promise<{ isActive: boolean, user: any } | null> {
    try {
        await connectDB();
        const user = await User.findById(userId).select('isActive email name');
        if (!user) return null;

        return {
            isActive: user.isActive ?? true,
            user: {
                id: user._id?.toString() || '',
                email: user.email,
                name: user.name,
                isActive: user.isActive ?? true
            }
        };
    } catch (error) {
        console.error('Error getting user status:', error);
        return null;
    }
}