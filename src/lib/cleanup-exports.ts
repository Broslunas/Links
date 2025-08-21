import { connectDB } from './db-utils';
import TempExport from '../models/TempExport';

/**
 * Clean up expired export entries from the database
 * This function can be called periodically or on-demand
 */
export async function cleanupExpiredExports(): Promise<{
  deletedCount: number;
}> {
  try {
    await connectDB();

    // Delete all exports that have expired
    const result = await TempExport.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return { deletedCount: result.deletedCount };
  } catch (error) {
    console.error('Error cleaning up expired exports:', error);
    throw error;
  }
}

/**
 * Get statistics about current exports
 */
export async function getExportStats(): Promise<{
  totalExports: number;
  expiredExports: number;
  activeExports: number;
}> {
  try {
    await connectDB();

    const now = new Date();

    const [totalExports, expiredExports] = await Promise.all([
      TempExport.countDocuments(),
      TempExport.countDocuments({ expiresAt: { $lt: now } }),
    ]);

    const activeExports = totalExports - expiredExports;

    return {
      totalExports,
      expiredExports,
      activeExports,
    };
  } catch (error) {
    console.error('Error getting export stats:', error);
    throw error;
  }
}
