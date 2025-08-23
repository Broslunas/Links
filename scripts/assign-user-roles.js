const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function assignUserRoles() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Contar usuarios sin rol
    const usersWithoutRole = await usersCollection.countDocuments({
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });
    
    console.log(`Usuarios sin rol encontrados: ${usersWithoutRole}`);
    
    if (usersWithoutRole === 0) {
      console.log('Todos los usuarios ya tienen roles asignados.');
      return;
    }
    
    // Asignar rol 'admin' a pablo@broslunas.com y pablo.luna.perez.008@gmail.com
    const adminEmails = ['pablo@broslunas.com', 'pablo.luna.perez.008@gmail.com'];
    
    for (const adminEmail of adminEmails) {
      const adminResult = await usersCollection.updateOne(
        { 
          email: adminEmail,
          $or: [
            { role: { $exists: false } },
            { role: null },
            { role: 'user' } // Also update existing users with 'user' role
          ]
        },
        { $set: { role: 'admin' } }
      );
      
      if (adminResult.matchedCount > 0) {
        console.log(`✅ Rol admin asignado a ${adminEmail}`);
      } else {
        console.log(`ℹ️  ${adminEmail} ya tiene rol admin asignado o no existe`);
      }
    }
    
    // Asignar rol 'user' a todos los demás usuarios sin rol
    const userResult = await usersCollection.updateMany(
      {
        email: { $nin: adminEmails },
        $or: [
          { role: { $exists: false } },
          { role: null }
        ]
      },
      { $set: { role: 'user' } }
    );
    
    console.log(`✅ Rol 'user' asignado a ${userResult.modifiedCount} usuarios`);
    
    // Mostrar resumen final
    const totalUsers = await usersCollection.countDocuments({});
    const adminUsers = await usersCollection.countDocuments({ role: 'admin' });
    const regularUsers = await usersCollection.countDocuments({ role: 'user' });
    
    console.log('\n📊 Resumen final:');
    console.log(`Total de usuarios: ${totalUsers}`);
    console.log(`Administradores: ${adminUsers}`);
    console.log(`Usuarios regulares: ${regularUsers}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
  }
}

// Ejecutar el script
if (require.main === module) {
  assignUserRoles()
    .then(() => {
      console.log('\n✅ Migración de roles completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la migración:', error);
      process.exit(1);
    });
}

module.exports = assignUserRoles;