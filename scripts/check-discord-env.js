// Script para verificar las variables de entorno de Discord
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando variables de entorno de Discord...\n');

const discordClientId = process.env.DISCORD_CLIENT_ID;
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;

console.log('DISCORD_CLIENT_ID:', discordClientId ? '✅ Configurado' : '❌ No configurado');
console.log('DISCORD_CLIENT_SECRET:', discordClientSecret ? '✅ Configurado' : '❌ No configurado');

if (discordClientId) {
    console.log('Client ID length:', discordClientId.length);
}

if (discordClientSecret) {
    console.log('Client Secret length:', discordClientSecret.length);
}

console.log('\n📋 Otras variables de entorno importantes:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configurado' : '❌ No configurado');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ No configurado');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL ? '✅ Configurado' : '❌ No configurado');

if (!discordClientId || !discordClientSecret) {
    console.log('\n⚠️  Para habilitar Discord, necesitas configurar:');
    console.log('DISCORD_CLIENT_ID=tu-discord-client-id');
    console.log('DISCORD_CLIENT_SECRET=tu-discord-client-secret');
    console.log('\n📖 Consulta docs/discord-integration.md para más información');
}