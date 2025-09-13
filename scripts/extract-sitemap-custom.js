const mongoose = require('mongoose');

// Configuración directa de MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// User ID específico
const TARGET_USER_ID = "PUT_YOUR_USER_ID";

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

// Función para convertir slug a título con formato específico
function slugToTitle(slug) {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

async function extractSitemapLinksCustom() {
    try {
        console.log('🚀 Iniciando extracción personalizada de enlaces del sitemap...');

        // Conectar a la base de datos
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a la base de datos');

        // Verificar que el usuario existe
        const targetUser = await mongoose.connection.db.collection('users').findOne({
            _id: new mongoose.Types.ObjectId(TARGET_USER_ID)
        });

        if (!targetUser) {
            throw new Error(`Usuario con ID ${TARGET_USER_ID} no encontrado`);
        }

        console.log(`👤 Usuario encontrado: ${targetUser.email || targetUser.name || TARGET_USER_ID}`);

        // Descargar el sitemap XML
        console.log('📥 Descargando sitemap...');
        const response = await fetch('https://videos.broslunas.com/sitemap-0.xml');

        if (!response.ok) {
            throw new Error(`Error al descargar sitemap: ${response.status} ${response.statusText}`);
        }

        const xmlData = await response.text();
        console.log('✅ Sitemap descargado correctamente');

        // Parsear XML manualmente (simple parser para sitemap)
        const urlMatches = xmlData.match(/<loc>(.*?)<\/loc>/g);

        if (!urlMatches) {
            throw new Error('No se encontraron URLs en el sitemap');
        }

        // Extraer URLs limpias
        const urls = urlMatches.map(match =>
            match.replace('<loc>', '').replace('</loc>', '').trim()
        );

        // Filtrar solo URLs que contengan "title"
        const titleUrls = urls.filter(url => url.includes('/title/'));

        console.log(`📊 Encontradas ${titleUrls.length} URLs con "title" de ${urls.length} URLs totales`);

        if (titleUrls.length === 0) {
            console.log('⚠️  No se encontraron URLs con "title"');
            return;
        }

        // Procesar cada URL
        const results = {
            created: 0,
            skipped: 0,
            errors: 0
        };

        for (const [index, url] of titleUrls.entries()) {
            try {
                // Extraer el slug después de /title/
                const match = url.match(/\/title\/(.+?)(?:\/|$)/);
                if (!match) {
                    console.log(`⚠️  No se pudo extraer slug de: ${url}`);
                    results.skipped++;
                    continue;
                }

                let slug = match[1];

                // Decodificar URL encoding si existe
                slug = decodeURIComponent(slug);

                // Limpiar el slug para que sea válido
                slug = slug
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]/g, '-') // Reemplazar caracteres no válidos con guiones
                    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
                    .replace(/^-|-$/g, '') // Remover guiones al inicio y final
                    .substring(0, 50); // Limitar longitud

                if (!slug) {
                    console.log(`⚠️  Slug vacío después de limpiar: ${url}`);
                    results.skipped++;
                    continue;
                }

                // Generar título personalizado (slug sin guiones, primera letra de cada palabra en mayúscula)
                const customTitle = slugToTitle(slug);

                console.log(`[${index + 1}/${titleUrls.length}] Procesando: ${slug}`);
                console.log(`   Título: "${customTitle}"`);

                // Verificar si el slug ya existe
                const existingLink = await Link.findOne({ slug });
                if (existingLink) {
                    console.log(`⚠️  Slug ya existe: ${slug}`);
                    results.skipped++;
                    continue;
                }

                // Crear el link con configuración personalizada
                const newLink = new Link({
                    userId: new mongoose.Types.ObjectId(TARGET_USER_ID),
                    originalUrl: url,
                    slug: slug,
                    title: customTitle,
                    description: 'Extraido del sitemap: "videos.broslunas.com"',
                    isPublicStats: false,
                    isActive: true,
                    isTemporary: false
                });

                await newLink.save();
                console.log(`✅ Link creado: ${slug} -> ${url}`);
                console.log(`   📝 Título: "${customTitle}"`);
                results.created++;

                // Pequeña pausa para no sobrecargar la base de datos
                if (index % 10 === 0 && index > 0) {
                    console.log(`💤 Pausa breve... (${index}/${titleUrls.length})`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (error) {
                console.error(`❌ Error procesando ${url}:`, error.message);
                results.errors++;
            }
        }

        console.log('\n📈 Resumen del proceso:');
        console.log(`✅ Links creados: ${results.created}`);
        console.log(`⚠️  Links omitidos: ${results.skipped}`);
        console.log(`❌ Errores: ${results.errors}`);
        console.log(`📊 Total procesado: ${results.created + results.skipped + results.errors}`);
        console.log(`👤 Usuario asignado: ${TARGET_USER_ID}`);
        console.log(`📝 Formato de título: Slug sin guiones, primera letra en mayúscula`);
        console.log(`📄 Descripción: "Extraido del sitemap: \\"videos.broslunas.com\\""`);

    } catch (error) {
        console.error('💥 Error general:', error.message);
    } finally {
        // Cerrar conexión a la base de datos
        await mongoose.connection.close();
        console.log('🔌 Conexión a la base de datos cerrada');
    }
}

// Ejecutar el script
if (require.main === module) {
    extractSitemapLinksCustom()
        .then(() => {
            console.log('🎉 Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { extractSitemapLinksCustom, slugToTitle };