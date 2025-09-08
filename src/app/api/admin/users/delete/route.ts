import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import AdminAction from '@/models/AdminAction';
import Link from '@/models/Link';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    // Validar parámetros requeridos
    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: { message: 'UserId y token son requeridos' } },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar la solicitud de eliminación con información del admin
    const deleteRequest = await DeleteRequest.findOne({
      userId: userId,
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('adminId', 'name email');

    if (!deleteRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud de eliminación no válida o expirada' } },
        { status: 404 }
      );
    }

    // Verificar que el usuario existe
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: userToDelete._id,
        email: userToDelete.email,
        name: userToDelete.name || 'Sin nombre'
      },
      deleteRequest: {
        reason: deleteRequest.reason,
        createdAt: deleteRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Error en delete confirmation:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    // Validar parámetros requeridos
    if (!userId || !token) {
      return NextResponse.json(
        { success: false, error: { message: 'UserId y token son requeridos' } },
        { status: 400 }
      );
    }

    await connectDB();

    // Buscar la solicitud de eliminación con información del admin
    const deleteRequest = await DeleteRequest.findOne({
      userId: userId,
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('adminId', 'name email');

    if (!deleteRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud de eliminación no válida o expirada' } },
        { status: 404 }
      );
    }

    // Verificar que el usuario existe
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Programar la eliminación para 1 hora después
    const scheduledDeletionAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora desde ahora
    
    try {
      // Marcar la solicitud como confirmada y programar eliminación
      await DeleteRequest.findByIdAndUpdate(
        deleteRequest._id,
        { 
          status: 'confirmed',
          scheduledDeletionAt: scheduledDeletionAt
        }
      );

      // Registrar la acción de confirmación
      await AdminAction.create({
        adminId: deleteRequest.adminId,
        actionType: 'delete_user',
        targetType: 'user',
        targetId: userId,
        targetEmail: userToDelete.email,
        reason: deleteRequest.reason,
        metadata: {
          scheduledDeletionAt: scheduledDeletionAt.toISOString()
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });

      // Webhook removido - solo se envía en la solicitud inicial, no en la confirmación

      return NextResponse.json({
        success: true,
        message: 'Eliminación confirmada. Los datos del usuario serán eliminados en 1 hora.',
        scheduledDeletionAt: scheduledDeletionAt.toISOString()
      });

    } catch (confirmationError) {
      console.error('Error en confirmación de eliminación:', confirmationError);
      return NextResponse.json(
        { success: false, error: { message: 'Error al confirmar la eliminación del usuario' } },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error en delete execution:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}