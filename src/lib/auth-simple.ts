import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from './db-utils';
import User from '../models/User';

export const authOptions: NextAuthOptions = {
    // Use JWT strategy instead of database adapter to avoid connection issues
    session: {
        strategy: 'jwt',
    },
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (!account || !user.email) {
                    return false;
                }

                await connectDB();

                // Check if user exists in our custom User model
                let existingUser = await User.findOne({
                    $or: [
                        { email: user.email },
                        { provider: account.provider, providerId: account.providerAccountId }
                    ]
                });

                if (!existingUser) {
                    // Create user in our custom model
                    existingUser = await User.create({
                        email: user.email,
                        name: user.name || '',
                        image: user.image,
                        provider: account.provider as 'github' | 'google',
                        providerId: account.providerAccountId,
                    });
                    console.log(`✅ Created new user: ${user.email}`);
                } else {
                    // Update existing user info if needed
                    existingUser.name = user.name || existingUser.name;
                    existingUser.image = user.image || existingUser.image;
                    await existingUser.save();
                    console.log(`✅ Updated existing user: ${user.email}`);
                }

                return true;
            } catch (error) {
                console.error('❌ Error during sign in:', error);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            // Persist user info in JWT token
            if (user && account) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
                token.provider = account.provider as 'github' | 'google';
            }
            return token;
        },
        async session({ session, token }) {
            // Send properties to the client
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.image as string;
                session.user.provider = token.provider as 'github' | 'google';
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};