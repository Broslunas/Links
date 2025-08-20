/**
 * Script de migración para establecer preferencias por defecto en usuarios existentes
 * - emailNotifications: true (habilitadas)
 * - defaultPublicStats: false (desactivadas)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function migrateUserPreferences() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ Error: MONGODB_URI no está definida en las variables de entorno');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔄 Conectando a MongoDB...');
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');

    // Contar usuarios existentes
    const totalUsers = await usersCollection.countDocuments();
    console.log(`📊 Total de usuarios encontrados: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('ℹ️  No hay usuarios para migrar.');
      return;
    }

    // Actualizar usuarios que no tienen las nuevas preferencias
    const result = await usersCollection.updateMany(
      {
        $or: [
          { emailNotifications: { $exists: false } },
          { defaultPublicStats: { $exists: false } }
        ]
      },
      {
        $set: {
          emailNotifications: true,
          defaultPublicStats: false
        }
      }
    );

    console.log(`✅ Migración completada:`);
    console.log(`   - Usuarios actualizados: ${result.modifiedCount}`);
    console.log(`   - Usuarios que ya tenían las preferencias: ${totalUsers - result.modifiedCount}`);
    
    // Verificar la migración
    const usersWithPreferences = await usersCollection.countDocuments({
      emailNotifications: { $exists: true },
      defaultPublicStats: { $exists: true }
    });
    
    console.log(`🔍 Verificación: ${usersWithPreferences}/${totalUsers} usuarios tienen las nuevas preferencias`);
    
    if (usersWithPreferences === totalUsers) {
      console.log('🎉 ¡Migración exitosa! Todos los usuarios tienen las preferencias configuradas.');
    } else {
      console.log('⚠️  Advertencia: Algunos usuarios no fueron actualizados.');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Conexión a MongoDB cerrada.');
  }
}

// Ejecutar la migración
if (require.main === module) {
  console.log('🚀 Iniciando migración de preferencias de usuario...');
  console.log('📋 Configuración:');
  console.log('   - emailNotifications: true (habilitadas)');
  console.log('   - defaultPublicStats: false (desactivadas)');
  console.log('');
  
  migrateUserPreferences()
    .then(() => {
      console.log('✨ Migración finalizada.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { migrateUserPreferences };