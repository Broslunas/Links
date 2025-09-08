import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import AdminAction from '@/models/AdminAction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, token } = await request.json();

    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: { message: 'userId y token son requeridos' } },
        { status: 400 }
      );
    }

    // Buscar la solicitud de eliminación
    const deleteRequest = await DeleteRequest.findOne({
      userId: userId,
      token: token,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('adminId', 'name email');

    if (!deleteRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud de eliminación no encontrada o ya procesada' } },
        { status: 404 }
      );
    }

    // Verificar que la solicitud no haya expirado
    if (deleteRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: { message: 'La solicitud de eliminación ha expirado' } },
        { status: 400 }
      );
    }

    // Obtener información del usuario
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Cancelar la solicitud
    await DeleteRequest.findByIdAndUpdate(
      deleteRequest._id,
      { 
        status: 'cancelled',
        completedAt: new Date()
      }
    );

    // Registrar la acción de cancelación
    await AdminAction.create({
      adminId: deleteRequest.adminId,
      actionType: 'cancel_delete_user',
      targetType: 'user',
      targetId: userId,
      targetEmail: userToDelete.email,
      reason: `Cancelación de eliminación: ${deleteRequest.reason}`,
      metadata: {
        action: 'cancelled',
        originalReason: deleteRequest.reason,
        cancelledAt: new Date().toISOString()
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // Enviar webhook de cancelación
    try {
      const adminUser = deleteRequest.adminId as any;
      const webhookData = {
        name: userToDelete.name || userToDelete.email,
        email: userToDelete.email,
        emailAdmin: adminUser?.email || 'admin',
        nameAdmin: adminUser?.name || adminUser?.email || 'Admin',
        reason: deleteRequest.reason,
        status: 'cancelled'
      };

      const webhookResponse = await fetch('https://hook.eu2.make.com/e7mprt6w5vpm6bru3pgjde3pw6i0mxgq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      if (!webhookResponse.ok) {
        console.error('Error enviando webhook de cancelación:', await webhookResponse.text());
      }
    } catch (webhookError) {
      console.error('Error en webhook de cancelación:', webhookError);
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación cancelada correctamente'
    });

  } catch (error) {
    console.error('Error cancelando solicitud de eliminación:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Error interno del servidor al cancelar la solicitud' 
        } 
      },
      { status: 500 }
    );
  }
}