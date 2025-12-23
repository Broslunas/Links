import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import crypto from 'crypto';

// POST /api/admin/password/request-setup
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Verificar que el usuario es administrador
    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log(`[Request Setup Debug] Generating token for user ${adminUser.email} (ID: ${adminUser._id})`);
    console.log(`[Request Setup Debug] Token generated: ${token}`);

    // Save token to user
    await User.findByIdAndUpdate(adminUser._id, {
      adminPasswordResetToken: token,
      adminPasswordResetExpires: expires
    });

    const setupUrl = `${request.nextUrl.origin}/admin/set-password?token=${token}`;

    // Send webhook to n8n to send email
    try {
      await fetch('https://n8n.broslunas.com/webhook-test/brl-link-set-pswd-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth': process.env.WEBHOOK_API_KEY || '',
        },
        body: JSON.stringify({
          action: 'request_admin_password_setup',
          adminName: adminUser.name,
          adminEmail: session.user.email,
          setupLink: setupUrl,
          expiresAt: expires.toISOString(),
          timestamp: new Date().toISOString(),
        })
      });
    } catch (webhookError) {
      console.error('Error sending admin password request webhook:', webhookError);
      return NextResponse.json(
        { success: false, error: { code: 'WEBHOOK_ERROR', message: 'Failed to send setup email' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password setup email sent successfully'
    });

  } catch (error) {
    console.error('Error requesting admin password setup:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
