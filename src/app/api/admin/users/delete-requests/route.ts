import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DeleteRequest from '@/models/DeleteRequest';
import User from '@/models/User';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: 'UserId es requerido' } },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Obtener todas las solicitudes de eliminación para este usuario
    const deleteRequests = await DeleteRequest.find({ userId })
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Formatear los datos para la respuesta
    const formattedRequests = deleteRequests.map(request => ({
      _id: request._id,
      reason: request.reason,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      expiresAt: request.expiresAt,
      completedAt: request.completedAt,
      scheduledDeletionAt: request.scheduledDeletionAt,
      admin: {
        name: (request.adminId as any)?.name || 'Admin',
        email: (request.adminId as any)?.email || 'admin@system.com'
      }
    }));

    return NextResponse.json({
      success: true,
      deleteRequests: formattedRequests,
      totalRequests: formattedRequests.length
    });

  } catch (error) {
    console.error('Error obteniendo solicitudes de eliminación:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, reason, adminId } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { success: false, error: { message: 'UserId y reason son requeridos' } },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const userExists = await User.findById(userId);
    if (!userExists) {
      return NextResponse.json(
        { success: false, error: { message: 'Usuario no encontrado' } },
        { status: 404 }
      );
    }

    // Generar token único para la solicitud
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Obtener un admin por defecto si no se proporciona
    let finalAdminId = adminId;
    if (!finalAdminId) {
      const defaultAdmin = await User.findOne({ role: 'admin' });
      if (defaultAdmin) {
        finalAdminId = defaultAdmin._id;
      } else {
        return NextResponse.json(
          { success: false, error: { message: 'No se encontró un administrador disponible' } },
          { status: 500 }
        );
      }
    }

    // Crear nueva solicitud de eliminación
    const deleteRequest = new DeleteRequest({
      userId,
      reason,
      adminId: finalAdminId,
      token,
      status: 'pending',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
    });

    await deleteRequest.save();

    return NextResponse.json({
      success: true,
      deleteRequest: {
        _id: deleteRequest._id,
        userId: deleteRequest.userId,
        reason: deleteRequest.reason,
        status: deleteRequest.status,
        token: deleteRequest.token,
        createdAt: deleteRequest.createdAt,
        expiresAt: deleteRequest.expiresAt
      }
    });

  } catch (error) {
    console.error('Error creando solicitud de eliminación:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de solicitud (cancelar)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: { message: 'RequestId y action son requeridos' } },
        { status: 400 }
      );
    }

    if (action !== 'cancel') {
      return NextResponse.json(
        { success: false, error: { message: 'Acción no válida' } },
        { status: 400 }
      );
    }

    // Buscar y actualizar la solicitud
    const deleteRequest = await DeleteRequest.findById(requestId);
    
    if (!deleteRequest) {
      return NextResponse.json(
        { success: false, error: { message: 'Solicitud no encontrada' } },
        { status: 404 }
      );
    }

    if (deleteRequest.status !== 'pending' && deleteRequest.status !== 'confirmed') {
      return NextResponse.json(
        { success: false, error: { message: 'Solo se pueden cancelar solicitudes pendientes o confirmadas' } },
        { status: 400 }
      );
    }

    // Actualizar el estado a cancelado
    deleteRequest.status = 'cancelled';
    deleteRequest.completedAt = new Date();
    await deleteRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Solicitud cancelada exitosamente',
      deleteRequest: {
        _id: deleteRequest._id,
        status: deleteRequest.status,
        completedAt: deleteRequest.completedAt
      }
    });

  } catch (error) {
    console.error('Error cancelando solicitud:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor' } },
      { status: 500 }
    );
  }
}