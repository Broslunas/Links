import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db-utils';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// POST /api/admin/password/set-with-token
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Token and password are required' } },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long' } },
        { status: 400 }
      );
    }

    await connectDB();

    console.log(`[Set Password Debug] Received token: ${token}`);
    
    // Debug: Check if any user has this token ignoring expiration
    const debugUser = await User.findOne({ adminPasswordResetToken: token });
    console.log(`[Set Password Debug] User found with token (ignoring expiry): ${debugUser ? debugUser.email : 'None'}`);
    if (debugUser) {
        console.log(`[Set Password Debug] Token expires: ${debugUser.adminPasswordResetExpires}`);
        console.log(`[Set Password Debug] Current time: ${new Date()}`);
        console.log(`[Set Password Debug] Is expired? ${debugUser.adminPasswordResetExpires < new Date()}`);
    }

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      adminPasswordResetToken: token,
      adminPasswordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' } },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Actualizar usuario
    user.adminPassword = hashedPassword;
    user.adminPasswordCreatedAt = new Date();
    user.adminPasswordResetToken = undefined; // Borrar token
    user.adminPasswordResetExpires = undefined;

    await user.save();

    // Send webhook notification (reusing the same logic as direct set)
    try {
      await fetch('https://n8n.broslunas.com/webhook-test/brl-link-set-pswd-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth': process.env.WEBHOOK_API_KEY || '',
        },
        body: JSON.stringify({
          action: 'set_admin_password',
          adminEmail: user.email,
          method: 'token_reset',
          timestamp: new Date().toISOString(),
        })
      });
    } catch (webhookError) {
      console.error('Error sending admin password webhook:', webhookError);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin password set successfully'
    });

  } catch (error) {
    console.error('Error setting admin password with token:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
