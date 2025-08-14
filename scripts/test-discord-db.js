// Script para probar la conexión a la base de datos y el guardado de usuarios de Discord
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Definir el esquema del usuario (copia del modelo)
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        trim: true,
    },
    provider: {
        type: String,
        required: true,
        enum: ['github', 'google', 'discord'],
    },
    providerId: {
        type: String,
        required: true,
        unique: true,
    },
    // Discord-specific fields
    discordUsername: {
        type: String,
        trim: true,
    },
    discordDiscriminator: {
        type: String,
        trim: true,
    },
    discordGlobalName: {
        type: String,
        trim: true,
    },
    discordVerified: {
        type: Boolean,
    },
    discordLocale: {
        type: String,
        trim: true,
    },
    // Additional provider data
    providerData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

// Crear índices
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);

async function testDiscordUser() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Datos de prueba de Discord
        const testDiscordUser = {
            email: 'test-discord@example.com',
            name: 'Test Discord User',
            image: 'https://cdn.discordapp.com/avatars/123/test.png',
            provider: 'discord',
            providerId: 'discord-test-123456',
            discordUsername: 'testuser',
            discordDiscriminator: '1234',
            discordGlobalName: 'Test Discord User',
            discordVerified: true,
            discordLocale: 'es-ES',
            providerData: {
                username: 'testuser',
                discriminator: '1234',
                global_name: 'Test Discord User',
                verified: true,
                locale: 'es-ES',
                avatar: 'test_avatar_hash',
                banner: 'test_banner_hash',
                accent_color: 5793266,
                premium_type: 2,
                public_flags: 64
            }
        };

        console.log('🗑️ Eliminando usuario de prueba existente...');
        await User.deleteOne({ email: testDiscordUser.email });

        console.log('💾 Creando usuario de Discord de prueba...');
        const createdUser = await User.create(testDiscordUser);
        console.log('✅ Usuario creado exitosamente:', {
            id: createdUser._id,
            email: createdUser.email,
            provider: createdUser.provider,
            discordUsername: createdUser.discordUsername,
            discordVerified: createdUser.discordVerified,
            providerData: createdUser.providerData
        });

        console.log('🔍 Verificando que el usuario se guardó correctamente...');
        const foundUser = await User.findById(createdUser._id);
        if (foundUser) {
            console.log('✅ Usuario encontrado en la base de datos:', {
                email: foundUser.email,
                discordUsername: foundUser.discordUsername,
                discordDiscriminator: foundUser.discordDiscriminator,
                discordGlobalName: foundUser.discordGlobalName,
                discordVerified: foundUser.discordVerified,
                discordLocale: foundUser.discordLocale,
                providerData: foundUser.providerData
            });
        } else {
            console.log('❌ Usuario no encontrado en la base de datos');
        }

        console.log('🗑️ Limpiando usuario de prueba...');
        await User.deleteOne({ _id: createdUser._id });
        console.log('✅ Usuario de prueba eliminado');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

testDiscordUser();