// Debug utilities for development
export function debugAuth() {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('🔍 NextAuth Debug Information:');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');

    console.log('\n🔑 OAuth Providers:');
    console.log('GitHub:', {
        clientId: process.env.GITHUB_CLIENT_ID ? '✅ Set' : '❌ Missing',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    });
    console.log('Google:', {
        clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
    });
}

export function debugSession(session: any, status: string) {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('🔍 Session Debug:', {
        status,
        user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            provider: session.user.provider,
        } : null,
    });
}