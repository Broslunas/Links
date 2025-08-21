import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import * as speakeasy from 'speakeasy';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import crypto from 'crypto';

// Función para generar códigos de respaldo
function generateBackupCodes(count: number = 8): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return createErrorResponse('No autorizado', 401);
    }

    const body = await request.json();
    const { token, isSetup = false } = body;

    if (!token) {
      return createErrorResponse('Token requerido', 400);
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404);
    }

    if (!user.twoFactorSecret) {
      return createErrorResponse('2FA no configurado', 400);
    }

    // Verificar el token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      // Si no es válido como TOTP, verificar si es un código de respaldo
      if (user.twoFactorEnabled && user.backupCodes && user.backupCodes.includes(token.toUpperCase())) {
        // Remover el código de respaldo usado
        user.backupCodes = user.backupCodes.filter((code: string) => code !== token.toUpperCase());
        await user.save();

        return createSuccessResponse({
          success: true,
          backupCodeUsed: true,
          remainingBackupCodes: user.backupCodes.length,
        });
      }

      return createErrorResponse('Token inválido', 400);
    }

    // Si es la configuración inicial, habilitar 2FA y generar códigos de respaldo
    if (isSetup) {
      const backupCodes = generateBackupCodes();

      user.twoFactorEnabled = true;
      user.backupCodes = backupCodes;
      await user.save();

      return createSuccessResponse({
        success: true,
        backupCodes: backupCodes,
        message: '2FA habilitado correctamente',
      });
    }

    // Verificación normal durante el login
    return createSuccessResponse({
      success: true,
    });

  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

// Endpoint para regenerar códigos de respaldo
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return createErrorResponse('No autorizado', 401);
    }

    const { token } = await request.json();
    
    if (!token) {
      return createErrorResponse('Token 2FA requerido para regenerar códigos', 400);
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.twoFactorEnabled) {
      return createErrorResponse('2FA no habilitado', 400);
    }

    // Verificar el token TOTP antes de regenerar códigos
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: token,
      window: 2,
    });

    if (!verified) {
      return createErrorResponse('Token inválido', 400);
    }

    // Generar nuevos códigos de respaldo
    const newBackupCodes = generateBackupCodes();
    user.backupCodes = newBackupCodes;
    await user.save();

    return createSuccessResponse({
      backupCodes: newBackupCodes,
    });

  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}