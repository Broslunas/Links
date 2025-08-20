import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { GlobalStats } from './api/stats/global/route';
import { ApiResponse } from '@/types';
import GSAPLanding from './gsap-landing';

// Function to fetch global stats
async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/stats/global`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data: ApiResponse<GlobalStats> = await response.json();

    if (data.success && data.data) {
      return data.data;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Error fetching global stats:', error);
    // Return fallback stats if API fails
    return {
      totalLinks: 0,
      totalClicks: 0,
      activeUsers: 0,
      uptime: '99.9%',
    };
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  const globalStats = await getGlobalStats();

  return <GSAPLanding session={session} globalStats={globalStats} />;
}
