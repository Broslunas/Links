// Script para probar el flujo de autenticación de Discord
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Importar el modelo de Usuario
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

const User = mongoose.model('TestUser', UserSchema);

// Simular el callback de signIn de NextAuth
async function simulateDiscordSignIn() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Simular datos que NextAuth recibiría de Discord
        const mockUser = {
            email: 'real-discord-test@example.com',
            name: 'Real Discord User',
            image: 'https://cdn.discordapp.com/avatars/123456789/real_avatar.png'
        };

        const mockAccount = {
            provider: 'discord',
            providerAccountId: 'real-discord-123456789',
            type: 'oauth'
        };

        const mockProfile = {
            id: 'real-discord-123456789',
            username: 'realdiscorduser',
            discriminator: '5678',
            global_name: 'Real Discord User',
            avatar: 'real_avatar_hash',
            verified: true,
            locale: 'es-ES',
            email: 'real-discord-test@example.com',
            banner: 'real_banner_hash',
            accent_color: 16711680,
            premium_type: 1,
            public_flags: 128
        };

        console.log('🎮 Simulando callback de Discord signIn...');
        console.log('📋 Datos del perfil de Discord:', JSON.stringify(mockProfile, null, 2));

        // Limpiar usuario de prueba existente
        await User.deleteOne({ email: mockUser.email });

        // Simular la lógica del callback signIn
        let existingUser = await User.findOne({
            $or: [
                { email: mockUser.email },
                { provider: mockAccount.provider, providerId: mockAccount.providerAccountId }
            ]
        });

        const userData = {
            email: mockUser.email,
            name: mockUser.name || '',
            image: mockUser.image,
            provider: mockAccount.provider,
            providerId: mockAccount.providerAccountId,
        };

        // Agregar datos específicos de Discord
        if (mockAccount.provider === 'discord' && mockProfile) {
            console.log('🎮 Procesando datos específicos de Discord...');
            
            userData.discordUsername = mockProfile.username;
            userData.discordDiscriminator = mockProfile.discriminator;
            userData.discordGlobalName = mockProfile.global_name;
            userData.discordVerified = mockProfile.verified;
            userData.discordLocale = mockProfile.locale;

            userData.providerData = {
                username: mockProfile.username,
                discriminator: mockProfile.discriminator,
                global_name: mockProfile.global_name,
                verified: mockProfile.verified,
                locale: mockProfile.locale,
                avatar: mockProfile.avatar,
                banner: mockProfile.banner,
                accent_color: mockProfile.accent_color,
                premium_type: mockProfile.premium_type,
                public_flags: mockProfile.public_flags,
            };
        }

        console.log('💾 Datos del usuario a guardar:', JSON.stringify(userData, null, 2));

        if (!existingUser) {
            console.log('➕ Creando nuevo usuario...');
            existingUser = await User.create(userData);
            console.log('✅ Usuario creado exitosamente:', {
                id: existingUser._id,
                email: existingUser.email,
                provider: existingUser.provider,
                discordUsername: existingUser.discordUsername,
                discordVerified: existingUser.discordVerified,
                hasProviderData: !!existingUser.providerData
            });
        }

        // Verificar que se guardó correctamente
        console.log('🔍 Verificando usuario en la base de datos...');
        const savedUser = await User.findById(existingUser._id);
        
        if (savedUser) {
            console.log('✅ Usuario verificado en la base de datos:');
            console.log('  📧 Email:', savedUser.email);
            console.log('  🎮 Discord Username:', savedUser.discordUsername);
            console.log('  🏷️ Discord Discriminator:', savedUser.discordDiscriminator);
            console.log('  🌐 Discord Global Name:', savedUser.discordGlobalName);
            console.log('  ✅ Discord Verified:', savedUser.discordVerified);
            console.log('  🌍 Discord Locale:', savedUser.discordLocale);
            console.log('  📦 Provider Data:', JSON.stringify(savedUser.providerData, null, 2));
        } else {
            console.log('❌ Usuario no encontrado en la base de datos');
        }

        // Limpiar
        console.log('🗑️ Limpiando usuario de prueba...');
        await User.deleteOne({ _id: existingUser._id });

    } catch (error) {
        console.error('❌ Error durante la simulación:', error);
        console.error('❌ Stack trace:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

simulateDiscordSignIn();