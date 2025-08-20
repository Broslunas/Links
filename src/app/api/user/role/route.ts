import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

interface UserRoleResponse {
  role: 'user' | 'admin';
}

const handler = async (request: NextRequest, { user }: { user: any }) => {
  try {
    return createSuccessResponse<UserRoleResponse>({
      role: user.role || 'user'
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    return createErrorResponse('Internal server error', 500);
  }
};

export const GET = withAuth(handler);