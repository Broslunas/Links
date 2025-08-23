const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function activateMaintenance() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const maintenanceCollection = db.collection('maintenancestates');
    
    // Activar modo mantenimiento
    const result = await maintenanceCollection.findOneAndUpdate(
      {}, // Buscar cualquier documento (singleton)
      {
        $set: {
          isActive: true,
          message: 'Mantenimiento programado para pruebas',
          estimatedDuration: 30,
          activatedBy: 'pablo@broslunas.com',
          activatedAt: new Date()
        }
      },
      {
        upsert: true, // Crear si no existe
        returnDocument: 'after'
      }
    );
    
    console.log('✅ Modo mantenimiento activado:', {
      isActive: result.value.isActive,
      message: result.value.message,
      estimatedDuration: result.value.estimatedDuration,
      activatedBy: result.value.activatedBy
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

activateMaintenance();