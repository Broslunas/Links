// Script para verificar usuarios existentes en la base de datos
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkExistingUsers() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener la colección de usuarios directamente
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log('👥 Verificando usuarios existentes...');
        const users = await usersCollection.find({}).toArray();
        
        console.log(`📊 Total de usuarios encontrados: ${users.length}`);

        if (users.length > 0) {
            console.log('\n👤 Usuarios existentes:');
            users.forEach((user, index) => {
                console.log(`\n--- Usuario ${index + 1} ---`);
                console.log('ID:', user._id);
                console.log('Email:', user.email);
                console.log('Nombre:', user.name);
                console.log('Proveedor:', user.provider);
                console.log('Provider ID:', user.providerId);
                
                // Verificar campos específicos de Discord
                if (user.provider === 'discord') {
                    console.log('🎮 Datos de Discord:');
                    console.log('  Username:', user.discordUsername || 'No definido');
                    console.log('  Discriminator:', user.discordDiscriminator || 'No definido');
                    console.log('  Global Name:', user.discordGlobalName || 'No definido');
                    console.log('  Verified:', user.discordVerified !== undefined ? user.discordVerified : 'No definido');
                    console.log('  Locale:', user.discordLocale || 'No definido');
                    console.log('  Provider Data:', user.providerData ? 'Presente' : 'No definido');
                    
                    if (user.providerData) {
                        console.log('  Provider Data Content:', JSON.stringify(user.providerData, null, 4));
                    }
                }
                
                console.log('Creado:', user.createdAt);
                console.log('Actualizado:', user.updatedAt);
            });
        } else {
            console.log('📭 No se encontraron usuarios en la base de datos');
        }

        // Verificar la estructura de la colección
        console.log('\n🏗️ Verificando estructura de la colección...');
        const indexes = await usersCollection.indexes();
        console.log('📋 Índices existentes:', indexes.map(idx => idx.name));

        // Verificar si hay usuarios de Discord específicamente
        const discordUsers = await usersCollection.find({ provider: 'discord' }).toArray();
        console.log(`\n🎮 Usuarios de Discord encontrados: ${discordUsers.length}`);

    } catch (error) {
        console.error('❌ Error al verificar usuarios:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

checkExistingUsers();