const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkMaintenanceDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    
    // Verificar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log('Colecciones disponibles:', collections.map(c => c.name));
    
    // Buscar en maintenancestates
    const maintenanceCollection = db.collection('maintenancestates');
    const maintenanceStates = await maintenanceCollection.find({}).toArray();
    console.log('Estados de mantenimiento encontrados:', maintenanceStates.length);
    console.log('Datos:', JSON.stringify(maintenanceStates, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

checkMaintenanceDB();