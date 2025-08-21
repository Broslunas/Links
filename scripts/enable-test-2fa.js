const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
require('dotenv').config({ path: '.env.local' });

// Define User schema directly since we can't import ES modules
const { Schema } = mongoose;

const UserSchema = new Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  image: String,
  provider: { type: String, enum: ['github', 'google', 'discord'] },
  providerId: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
  backupCodes: { type: [String], default: [] },
  defaultPublicStats: { type: Boolean, default: false },
  emailNotifications: { type: Boolean, default: true },
  discordUsername: String,
  discordDiscriminator: String,
  discordGlobalName: String,
  discordVerified: Boolean,
  discordLocale: String,
  providerData: { type: Schema.Types.Mixed, default: {} },
  apiToken: String,
  apiTokenCreatedAt: Date,
  apiTokenLastUsedAt: Date
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function enableTest2FA() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Find user by email (replace with your test email)
    const testEmail = 'pablo@broslunas.com'; // Change this to your test email
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log('❌ Usuario no encontrado:', testEmail);
      process.exit(1);
    }

    console.log('👤 Usuario encontrado:', user.name, user.email);

    // Generate a test 2FA secret
    const secret = speakeasy.generateSecret({
      name: 'BRL Links Test',
      account: user.email,
      issuer: 'BRL Links'
    });

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    // Enable 2FA for the user
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret.base32;
    user.backupCodes = backupCodes;
    
    await user.save();
    
    console.log('🔐 2FA habilitado para el usuario');
    console.log('🔑 Secret (base32):', secret.base32);
    console.log('📱 QR Code URL:', secret.otpauth_url);
    console.log('🆘 Backup codes:', backupCodes);
    
    // Generate a test token for immediate verification
    const token = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32'
    });
    
    console.log('🎯 Token actual para prueba:', token);
    console.log('\n⚠️  IMPORTANTE: Guarda el secret y los backup codes para poder hacer login!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

enableTest2FA();