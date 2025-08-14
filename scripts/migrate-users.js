// Script para migrar usuarios existentes y agregar campos de Discord
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function migrateUsers() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log('🔍 Verificando usuarios que necesitan migración...');
        const usersToMigrate = await usersCollection.find({
            $or: [
                { discordUsername: { $exists: false } },
                { discordDiscriminator: { $exists: false } },
                { discordGlobalName: { $exists: false } },
                { discordVerified: { $exists: false } },
                { discordLocale: { $exists: false } },
                { providerData: { $exists: false } }
            ]
        }).toArray();

        console.log(`📊 Usuarios que necesitan migración: ${usersToMigrate.length}`);

        if (usersToMigrate.length > 0) {
            console.log('🔄 Iniciando migración...');
            
            for (const user of usersToMigrate) {
                const updateFields = {};
                
                // Agregar campos de Discord si no existen
                if (!user.hasOwnProperty('discordUsername')) {
                    updateFields.discordUsername = null;
                }
                if (!user.hasOwnProperty('discordDiscriminator')) {
                    updateFields.discordDiscriminator = null;
                }
                if (!user.hasOwnProperty('discordGlobalName')) {
                    updateFields.discordGlobalName = null;
                }
                if (!user.hasOwnProperty('discordVerified')) {
                    updateFields.discordVerified = null;
                }
                if (!user.hasOwnProperty('discordLocale')) {
                    updateFields.discordLocale = null;
                }
                if (!user.hasOwnProperty('providerData')) {
                    updateFields.providerData = {};
                }

                if (Object.keys(updateFields).length > 0) {
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: updateFields }
                    );
                    console.log(`✅ Migrado usuario: ${user.email} (${user.provider})`);
                }
            }
            
            console.log('🎉 Migración completada');
        } else {
            console.log('✅ Todos los usuarios ya tienen la estructura correcta');
        }

        // Verificar la migración
        console.log('\n🔍 Verificando migración...');
        const allUsers = await usersCollection.find({}).toArray();
        
        allUsers.forEach(user => {
            const hasAllFields = [
                'discordUsername',
                'discordDiscriminator', 
                'discordGlobalName',
                'discordVerified',
                'discordLocale',
                'providerData'
            ].every(field => user.hasOwnProperty(field));
            
            console.log(`👤 ${user.email} (${user.provider}): ${hasAllFields ? '✅' : '❌'} Estructura completa`);
        });

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Desconectado de MongoDB');
    }
}

migrateUsers();