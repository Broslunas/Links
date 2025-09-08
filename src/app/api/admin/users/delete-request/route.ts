import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import AdminAction from '@/models/AdminAction';
import crypto from 'crypto';
import mongoose from 'mongoose';

interface DeleteRequestBody {
  userId: string;
  reason: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    await connectDB();
    const adminUser = await User.findOne({
      email: session.user.email,
      role: 'admin'
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: { message: 'Acceso denegado. Se requieren permisos de administrador.' } },
        { status: 403 }
      );
    }

    // Obtener datos del cuerpo de la petición
    const body: DeleteRequestBody = await request.json();
    const { userId, reason } = body;

    // Validar datos requeridos
    if (!userId || !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: { message: 'UserId y razón son requeridos' } },
        { status: 400 }
      );
    }

    // Verificar que el usuario a eliminar existe
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Generar token único para la confirmación
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar la solicitud de eliminación en la base de datos
    await DeleteRequest.create({
      userId: userId,
      adminId: adminUser._id,
      reason: reason.trim(),
      token,
      expiresAt,
      status: 'pending'
    });

    // Preparar datos para el webhook
    const cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard/admin?cancelDeletionUser=${userId}&token=${token}`;
    
    const webhookData = {
      name: userToDelete.name || userToDelete.email,
      email: userToDelete.email,
      emailAdmin: adminUser.email,
      nameAdmin: adminUser.name || adminUser.email,
      link: `${process.env.NEXTAUTH_URL}/dashboard/admin/?deleteUser=${userId}&token=${token}`,
      reason: reason.trim(),
      status: 'pendingConfirmation',
      cancelUrl: cancelUrl
    };

    // Enviar datos al webhook de Make.com
    try {
      const webhookResponse = await fetch('https://hook.eu2.make.com/e7mprt6w5vpm6bru3pgjde3pw6i0mxgq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });

      if (!webhookResponse.ok) {
        console.error('Error enviando webhook:', await webhookResponse.text());
        // No fallar la operación si el webhook falla
      }
    } catch (webhookError) {
      console.error('Error enviando webhook:', webhookError);
      // No fallar la operación si el webhook falla
    }

    // Registrar la acción administrativa
    await AdminAction.create({
      adminId: adminUser._id,
      adminEmail: adminUser.email,
      actionType: 'delete_user_request',
      targetType: 'user',
      targetId: userId,
      targetEmail: userToDelete.email,
      reason: reason.trim(),
      metadata: {
        token: token.substring(0, 8) + '...' // Solo los primeros 8 caracteres por seguridad
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación enviada correctamente'
    });

  } catch (error) {
    console.error('Error en delete-request:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}