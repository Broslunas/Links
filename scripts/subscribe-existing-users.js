/**
 * Script para suscribir a todos los usuarios existentes a la newsletter
 * Envía peticiones al webhook con un intervalo de 10 segundos entre cada una
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Definir el esquema de usuario directamente en el script
const { Schema } = mongoose;

const UserSchema = new Schema({
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
  providerData: {
    type: Schema.Types.Mixed,
    default: {},
  },
  apiToken: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  apiTokenCreatedAt: {
    type: Date,
  },
  apiTokenLastUsedAt: {
    type: Date,
  },
  defaultPublicStats: {
    type: Boolean,
    default: false,
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Crear índices
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const WEBHOOK_URL = 'https://hook.eu2.make.com/389gtp6bvdbnw877wgaihka8kr3ykssk';
const DELAY_MS = 10000; // 10 segundos

/**
 * Envía datos de suscripción al webhook
 */
async function sendSubscriptionWebhook(name, email) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'subscribe',
        name,
        email,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(`❌ Webhook failed for ${email}:`, response.status, response.statusText);
      return false;
    }

    console.log(`✅ Webhook sent successfully for ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending webhook for ${email}:`, error.message);
    return false;
  }
}

/**
 * Función para esperar un tiempo determinado
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Función principal
 */
async function subscribeExistingUsers() {
  try {
    console.log('🚀 Iniciando script de suscripción de usuarios existentes...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const users = await User.find({}, 'name email emailNotifications').lean();
    console.log(`📊 Encontrados ${users.length} usuarios`);

    if (users.length === 0) {
      console.log('ℹ️ No hay usuarios para procesar');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userName = user.name || 'Usuario';
      const userEmail = user.email;

      console.log(`\n📧 Procesando usuario ${i + 1}/${users.length}: ${userEmail}`);

      // Verificar si el usuario ya tiene emailNotifications activado
      if (user.emailNotifications === false) {
        console.log(`⏭️ Usuario ${userEmail} tiene emailNotifications desactivado, omitiendo...`);
        skippedCount++;
      } else {
        // Enviar webhook
        const success = await sendSubscriptionWebhook(userName, userEmail);
        
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      // Esperar 10 segundos antes del siguiente usuario (excepto en el último)
      if (i < users.length - 1) {
        console.log(`⏳ Esperando 10 segundos antes del siguiente usuario...`);
        await delay(DELAY_MS);
      }
    }

    console.log('\n📈 Resumen de la ejecución:');
    console.log(`✅ Webhooks enviados exitosamente: ${successCount}`);
    console.log(`❌ Webhooks fallidos: ${errorCount}`);
    console.log(`⏭️ Usuarios omitidos: ${skippedCount}`);
    console.log(`📊 Total procesados: ${users.length}`);

  } catch (error) {
    console.error('❌ Error en el script:', error);
  } finally {
    // Cerrar conexión a MongoDB
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a MongoDB cerrada');
    console.log('✨ Script completado');
  }
}

// Ejecutar el script
if (require.main === module) {
  subscribeExistingUsers()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { subscribeExistingUsers };