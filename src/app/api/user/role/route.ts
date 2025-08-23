import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // For now, return a default role since we're not using the database
    // TODO: Implement proper role checking with database
    const userRole = session.user.email === 'admin@test.com' ? 'admin' : 'user';

    return NextResponse.json({
      role: userRole,
      email: session.user.email
    });
  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}