import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth-simple';
import dbConnect from '@/lib/mongodb';
import Link from '@/models/Link';
import User from '@/models/User';

// GET - Obtener enlaces con paginación y filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construir filtros
    const filters: any = {};
    
    if (search) {
      filters.$or = [
        { slug: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { originalUrl: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      filters.isActive = true;
    } else if (status === 'inactive') {
      filters.isActive = false;
    }

    // Construir ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener enlaces con información del usuario
    const links = await Link.find(filters)
      .populate('userId', 'email name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Contar total de enlaces
    const totalLinks = await Link.countDocuments(filters);
    const totalPages = Math.ceil(totalLinks / limit);

    return NextResponse.json({
      success: true,
      data: {
        links,
        totalLinks,
        totalPages,
        currentPage: page
      }
    });

  } catch (error) {
    console.error('Error fetching admin links:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar enlace
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { linkId, title, description, isActive, isPublicStats, isDisabledByAdmin, disabledReason } = body;

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'ID del enlace requerido' },
        { status: 400 }
      );
    }

    // Construir objeto de actualización
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublicStats !== undefined) updateData.isPublicStats = isPublicStats;
    if (isDisabledByAdmin !== undefined) {
      updateData.isDisabledByAdmin = isDisabledByAdmin;
      // Si se está deshabilitando, requerir motivo
      if (isDisabledByAdmin && !disabledReason) {
        return NextResponse.json(
          { success: false, error: 'Se requiere un motivo para deshabilitar el enlace' },
          { status: 400 }
        );
      }
      // Si se está habilitando, limpiar el motivo
      if (!isDisabledByAdmin) {
        updateData.disabledReason = null;
      }
    }
    if (disabledReason !== undefined) updateData.disabledReason = disabledReason;

    // Actualizar enlace
    const updatedLink = await Link.findByIdAndUpdate(
      linkId,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'email name');

    if (!updatedLink) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedLink
    });

  } catch (error) {
    console.error('Error updating link:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar enlace
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'ID del enlace requerido' },
        { status: 400 }
      );
    }

    // Eliminar enlace
    const deletedLink = await Link.findByIdAndDelete(linkId);

    if (!deletedLink) {
      return NextResponse.json(
        { success: false, error: 'Enlace no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enlace eliminado correctamente'
    });

  } catch (error) {
    console.error('Error deleting link:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}