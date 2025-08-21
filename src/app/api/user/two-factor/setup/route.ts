import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('No autorizado', 401);
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404);
    }

    // Si ya tiene 2FA habilitado, no permitir reconfiguración
    if (user.twoFactorEnabled) {
      return createErrorResponse('2FA ya está habilitado', 400);
    }

    // Generar secreto para TOTP
    const secret = speakeasy.generateSecret({
      name: `Broslunas Links (${user.email})`,
      issuer: 'Broslunas Link',
      length: 32,
    });

    // Guardar el secreto temporalmente (no habilitado aún)
    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generar código QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return createSuccessResponse({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('No autorizado', 401);
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404);
    }

    return createSuccessResponse({
      enabled: user.twoFactorEnabled || false,
      hasSecret: !!user.twoFactorSecret,
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
