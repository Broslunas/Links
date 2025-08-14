// Script para probar Discord en tiempo real (simula un login real)
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Usar el mismo modelo que la aplicación
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    provider: { type: String, required: true, enum: ['github', 'google', 'discord'] },
    providerId: { type: String, required: true, unique: true },
    discordUsername: { type: String, trim: true },
    discordDiscriminator: { type: String, trim: true },
    discordGlobalName: { type: String, trim: true },
    discordVerified: { type: Boolean },
    discordLocale: { type: String, trim: true },
    providerData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('LiveTestUser', UserSchema);

async function testDiscordLive() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Usar un email real para probar con un usuario existente
        const testEmail = 'pablo.luna.perez.008@gmail.com'; // Cambia esto por tu email real
        
        console.log(`🔍 Buscando usuario existente con email: ${testEmail}`);
        
        // Buscar en la colección real de usuarios
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const existingUser = await usersCollection.findOne({ email: testEmail });
        
        if (existingUser) {
            console.log('👤 Usuario existente encontrado:', {
                email: existingUser.email,
                provider: existingUser.provider,
                hasDiscordFields: !!(existingUser.discordUsername !== undefined)
            });

            // Simular login con Discord para este usuario existente
            const mockDiscordProfile = {
                id: 'discord-test-' + Date.now(),
                username: 'testdiscorduser',
                discriminator: '9999',
                global_name: 'Test Discord User',
                avatar: 'test_avatar_hash',
                verified: true,
                locale: 'es-ES',
                email: testEmail,
                banner: null,
                accent_color: 5793266,
                premium_type: 0,
                public_flags: 0
            };

            console.log('🎮 Simulando login con Discord para usuario existente...');
            
            // Actualizar el usuario existente con datos de Discord
            const updateData = {
                discordUsername: mockDiscordProfile.username,
                discordDiscriminator: mockDiscordProfile.discriminator,
                discordGlobalName: mockDiscordProfile.global_name,
                discordVerified: mockDiscordProfile.verified,
                discordLocale: mockDiscordProfile.locale,
                providerData: {
                    username: mockDiscordProfile.username,
                    discriminator: mockDiscordProfile.discriminator,
                    global_name: mockDiscordProfile.global_name,
                    verified: mockDiscordProfile.verified,
                    locale: mockDiscordProfile.locale,
                    avatar: mockDiscordProfile.avatar,
                    banner: mockDiscordProfile.banner,
                    accent_color: mockDiscordProfile.accent_color,
                    premium_type: mockDiscordProfile.premium_type,
                    public_flags: mockDiscordProfile.public_flags,
                },
                updatedAt: new Date()
            };

            const result = await usersCollection.updateOne(
                { email: testEmail },
                { $set: updateData }
            );

            if (result.modifiedCount > 0) {
                console.log('✅ Usuario actualizado con datos de Discord');
                
                // Verificar la actualización
                const updatedUser = await usersCollection.findOne({ email: testEmail });
                console.log('🔍 Usuario actualizado:', {
                    email: updatedUser.email,
                    discordUsername: updatedUser.discordUsername,
                    discordVerified: updatedUser.discordVerified,
                    hasProviderData: !!updatedUser.providerData,
                    providerDataKeys: Object.keys(updatedUser.providerData || {})
                });

                console.log('📦 Provider Data completo:', JSON.stringify(updatedUser.providerData, null, 2));
            } else {
                console.log('❌ No se pudo actualizar el usuario');
            }

        } else {
            console.log('❌ Usuario no encontrado. Usa un email de un usuario existente.');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

console.log('🚀 Iniciando prueba de Discord en tiempo real...');
console.log('📝 Esta prueba simula lo que pasaría cuando un usuario existente se loguea con Discord');
console.log('');

testDiscordLive();