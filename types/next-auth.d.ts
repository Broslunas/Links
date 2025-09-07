import NextAuth from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string;
            provider: 'github' | 'google' | 'discord' | 'twitch';
            role: 'user' | 'admin';
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        image?: string;
        provider: 'github' | 'google' | 'discord' | 'twitch';
        role: 'user' | 'admin';
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        name: string;
        image?: string;
        provider: 'github' | 'google' | 'discord' | 'twitch';
        role: 'user' | 'admin';
    }
}