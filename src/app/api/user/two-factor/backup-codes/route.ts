import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import * as speakeasy from 'speakeasy';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

// Endpoint para deshabilitar 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return createErrorResponse('No autorizado', 401);
    }

    const { token } = await request.json();
    
    if (!token) {
      return createErrorResponse('Token 2FA requerido para deshabilitar', 400);
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404);
    }

    if (!user.twoFactorEnabled) {
      return createErrorResponse('2FA no está habilitado', 400);
    }

    // Verificar el token TOTP o código de respaldo
    let verified = false;
    
    // Primero intentar verificar como TOTP
    if (user.twoFactorSecret) {
      verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2,
      });
    }
    
    // Si no es válido como TOTP, verificar si es un código de respaldo
    if (!verified && user.backupCodes && user.backupCodes.includes(token.toUpperCase())) {
      verified = true;
      // Remover el código de respaldo usado
      user.backupCodes = user.backupCodes.filter((code: string) => code !== token.toUpperCase());
    }

    if (!verified) {
      return createErrorResponse('Token inválido', 400);
    }

    // Deshabilitar 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.backupCodes = [];
    await user.save();

    return createSuccessResponse({
      success: true,
    });

  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

// Endpoint para obtener códigos de respaldo (solo mostrar cantidad)
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

    if (!user.twoFactorEnabled) {
      return createErrorResponse('2FA no está habilitado', 400);
    }

    return createSuccessResponse({
      backupCodesCount: user.backupCodes?.length || 0,
    });

  } catch (error) {
    console.error('Error getting backup codes info:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}