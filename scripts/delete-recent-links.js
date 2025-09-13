const mongoose = require('mongoose');

// Configuración directa de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Esquema del Link (simplificado)
const LinkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    originalUrl: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 1,
        maxlength: 50,
        match: /^[a-z0-9-_]+$/,
    },
    title: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    isPublicStats: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDisabledByAdmin: {
        type: Boolean,
        default: false,
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    clickCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    isTemporary: {
        type: Boolean,
        default: false,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
    isExpired: {
        type: Boolean,
        default: false,
    },
    customDomain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomDomain',
        default: null,
    },
}, {
    timestamps: true,
});

const Link = mongoose.model('Link', LinkSchema);

async function deleteRecentLinks() {
    try {
        console.log('🗑️  Iniciando eliminación de enlaces recientes...');

        // Conectar a la base de datos
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a la base de datos');

        // Calcular la fecha de hace una hora
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        console.log(`🕐 Buscando enlaces creados después de: ${oneHourAgo.toLocaleString()}`);

        // Buscar enlaces creados en la última hora
        const recentLinks = await Link.find({
            createdAt: { $gte: oneHourAgo }
        }).select('_id slug originalUrl createdAt');

        console.log(`📊 Encontrados ${recentLinks.length} enlaces creados en la última hora`);

        if (recentLinks.length === 0) {
            console.log('ℹ️  No hay enlaces para eliminar');
            return;
        }

        // Mostrar algunos ejemplos de los enlaces que se van a eliminar
        console.log('\n📋 Ejemplos de enlaces que se eliminarán:');
        const examples = recentLinks.slice(0, 5);
        examples.forEach((link, index) => {
            console.log(`  ${index + 1}. ${link.slug} -> ${link.originalUrl}`);
            console.log(`     Creado: ${link.createdAt.toLocaleString()}`);
        });

        if (recentLinks.length > 5) {
            console.log(`  ... y ${recentLinks.length - 5} enlaces más`);
        }

        // Confirmar eliminación (en un entorno de producción podrías agregar una confirmación interactiva)
        console.log('\n⚠️  ADVERTENCIA: Esta acción eliminará permanentemente estos enlaces');
        console.log('🚀 Procediendo con la eliminación...');

        // Eliminar los enlaces
        const deleteResult = await Link.deleteMany({
            createdAt: { $gte: oneHourAgo }
        });

        console.log(`\n✅ Eliminación completada:`);
        console.log(`   📊 Enlaces eliminados: ${deleteResult.deletedCount}`);
        console.log(`   🕐 Criterio: Creados después de ${oneHourAgo.toLocaleString()}`);

        // Verificar que se eliminaron correctamente
        const remainingRecentLinks = await Link.countDocuments({
            createdAt: { $gte: oneHourAgo }
        });

        if (remainingRecentLinks === 0) {
            console.log('✅ Verificación: No quedan enlaces recientes en la base de datos');
        } else {
            console.log(`⚠️  Advertencia: Aún quedan ${remainingRecentLinks} enlaces recientes`);
        }

    } catch (error) {
        console.error('💥 Error durante la eliminación:', error.message);
        throw error;
    } finally {
        // Cerrar conexión a la base de datos
        await mongoose.connection.close();
        console.log('🔌 Conexión a la base de datos cerrada');
    }
}

// Función para mostrar estadísticas antes de eliminar
async function showStatistics() {
    try {
        await mongoose.connect(MONGODB_URI);

        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const totalLinks = await Link.countDocuments();
        const recentLinks = await Link.countDocuments({
            createdAt: { $gte: oneHourAgo }
        });

        console.log('📊 Estadísticas actuales:');
        console.log(`   Total de enlaces: ${totalLinks}`);
        console.log(`   Enlaces creados en la última hora: ${recentLinks}`);
        console.log(`   Enlaces que permanecerán: ${totalLinks - recentLinks}`);

        await mongoose.connection.close();

        return recentLinks > 0;
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error.message);
        return false;
    }
}

// Función principal con confirmación
async function main() {
    try {
        console.log('🔍 Analizando enlaces recientes...\n');

        const hasRecentLinks = await showStatistics();

        if (!hasRecentLinks) {
            console.log('\nℹ️  No hay enlaces creados en la última hora para eliminar');
            return;
        }

        console.log('\n' + '='.repeat(50));
        console.log('⚠️  ELIMINACIÓN DE ENLACES RECIENTES');
        console.log('='.repeat(50));

        await deleteRecentLinks();

        console.log('\n🎉 Proceso completado exitosamente');

    } catch (error) {
        console.error('💥 Error fatal:', error.message);
        process.exit(1);
    }
}

// Ejecutar el script
if (require.main === module) {
    main()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { deleteRecentLinks, showStatistics };