import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import AdminAction from '@/models/AdminAction';
import Link from '@/models/Link';
import UserNote from '@/models/UserNote';
import UserWarning from '@/models/UserWarning';
import mongoose from 'mongoose';

// Force Node.js runtime for Mongoose compatibility
export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  try {
    // Verificar que la solicitud viene del cron job de Vercel o tiene autorización
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!authHeader && !cronSecret) {
      return NextResponse.json(
        { success: false, error: { message: 'No autorizado' } },
        { status: 401 }
      );
    }
    
    if (authHeader && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: { message: 'Token de autorización inválido' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Buscar solicitudes confirmadas cuyo tiempo de eliminación programada ya pasó
    // y que no hayan sido canceladas
    const now = new Date();
    const scheduledDeletions = await DeleteRequest.find({
      status: 'confirmed',
      scheduledDeletionAt: { $lte: now }
    }).populate('adminId', 'name email');
    
    // Filtrar las que no han sido canceladas (verificación adicional)
    const validDeletions = [];
    for (const deletion of scheduledDeletions) {
      const currentStatus = await DeleteRequest.findById(deletion._id).select('status');
      if (currentStatus && currentStatus.status === 'confirmed') {
        validDeletions.push(deletion);
      }
    }

    if (validDeletions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay eliminaciones programadas para procesar',
        processed: 0
      });
    }

    let processedCount = 0;
    const results = [];

    for (const deleteRequest of validDeletions) {
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          const userId = deleteRequest.userId;
          
          // Obtener datos del usuario antes de eliminarlo
          const userToDelete = await User.findById(userId).session(session);
          if (!userToDelete) {
            throw new Error(`Usuario ${userId} no encontrado`);
          }

          // Eliminar todos los enlaces del usuario
          await Link.deleteMany({ userId: userId }).session(session);

          // Eliminar notas del usuario
          await UserNote.deleteMany({ userId: userId }).session(session);

          // Eliminar advertencias del usuario
          await UserWarning.deleteMany({ userId: userId }).session(session);

          // Eliminar acciones administrativas relacionadas
          await AdminAction.deleteMany({ targetId: userId }).session(session);

          // Eliminar el usuario
          await User.findByIdAndDelete(userId).session(session);

          // Marcar la solicitud como completada
          await DeleteRequest.findByIdAndUpdate(
            deleteRequest._id,
            { 
              status: 'completed',
              completedAt: new Date()
            }
          ).session(session);

          // Registrar la acción de eliminación completada
          await AdminAction.create([{
            adminId: deleteRequest.adminId,
            actionType: 'delete_user_completed',
            targetType: 'user',
            targetId: userId,
            targetEmail: userToDelete.email,
            reason: deleteRequest.reason,
            metadata: {
              deletedData: {
                links: true,
                notes: true,
                warnings: true,
                user: true
              },
              scheduledDeletionAt: deleteRequest.scheduledDeletionAt?.toISOString(),
              processedAt: new Date().toISOString()
            },
            ipAddress: 'system'
          }], { session });

          // Enviar webhook de confirmación final
          try {
            const adminUser = deleteRequest.adminId as any;
            const webhookData = {
              name: userToDelete.name || userToDelete.email,
              email: userToDelete.email,
              emailAdmin: adminUser?.email || 'admin',
              nameAdmin: adminUser?.name || adminUser?.email || 'Admin',
              reason: deleteRequest.reason,
              status: 'confirmed'
            };

            const webhookResponse = await fetch('https://hook.eu2.make.com/4ywvkqhvnhqhqhqhqhqhqhqhqhqhqhqh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookData)
            });

            if (!webhookResponse.ok) {
              console.error('Error enviando webhook final:', await webhookResponse.text());
            }
          } catch (webhookError) {
            console.error('Error en webhook final:', webhookError);
          }
        });

        processedCount++;
        results.push({
          userId: deleteRequest.userId,
          status: 'success',
          message: 'Usuario eliminado correctamente'
        });

      } catch (error) {
        console.error(`Error procesando eliminación de usuario ${deleteRequest.userId}:`, error);
        results.push({
          userId: deleteRequest.userId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      } finally {
        await session.endSession();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesadas ${processedCount} de ${scheduledDeletions.length} eliminaciones programadas`,
      processed: processedCount,
      total: scheduledDeletions.length,
      results
    });

  } catch (error) {
    console.error('Error procesando eliminaciones programadas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Error interno del servidor al procesar eliminaciones programadas' 
        } 
      },
      { status: 500 }
    );
  }
}