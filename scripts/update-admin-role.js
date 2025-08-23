const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function updateAdminRole() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Actualizar rol de pablo.luna.perez.008@gmail.com a admin
    const result = await usersCollection.updateOne(
      { email: 'pablo.luna.perez.008@gmail.com' },
      { $set: { role: 'admin' } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Rol admin asignado a pablo.luna.perez.008@gmail.com');
      console.log(`Documentos modificados: ${result.modifiedCount}`);
    } else {
      console.log('❌ Usuario pablo.luna.perez.008@gmail.com no encontrado');
    }
    
    // Verificar el usuario actualizado
    const user = await usersCollection.findOne({ email: 'pablo.luna.perez.008@gmail.com' });
    console.log('Usuario actual:', {
      email: user?.email,
      role: user?.role,
      name: user?.name
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

updateAdminRole();