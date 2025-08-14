import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
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
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'identify email',
                },
            },
        }),
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                console.log('🔐 SignIn callback triggered:', {
                    provider: account?.provider,
                    userEmail: user?.email,
                    hasProfile: !!profile
                });

                if (!account || !user.email) {
                    console.log('❌ Missing account or user email');
                    return false;
                }

                // Log Discord profile data for debugging
                if (account.provider === 'discord') {
                    console.log('🎮 Discord profile data:', JSON.stringify(profile, null, 2));
                }

                await connectDB();

                // Check if user exists in our custom User model
                let existingUser = await User.findOne({
                    $or: [
                        { email: user.email },
                        { provider: account.provider, providerId: account.providerAccountId }
                    ]
                });

                console.log('👤 Existing user found:', !!existingUser);

                // Prepare user data with provider-specific information
                const userData: any = {
                    email: user.email,
                    name: user.name || '',
                    image: user.image,
                    provider: account.provider as 'github' | 'google' | 'discord',
                    providerId: account.providerAccountId,
                };

                // Add Discord-specific data if available
                if (account.provider === 'discord' && profile) {
                    const discordProfile = profile as any;
                    console.log('🎮 Processing Discord profile data...');

                    userData.discordUsername = discordProfile.username;
                    userData.discordDiscriminator = discordProfile.discriminator;
                    userData.discordGlobalName = discordProfile.global_name;
                    userData.discordVerified = discordProfile.verified;
                    userData.discordLocale = discordProfile.locale;

                    // Store complete profile data for future reference
                    userData.providerData = {
                        username: discordProfile.username,
                        discriminator: discordProfile.discriminator,
                        global_name: discordProfile.global_name,
                        verified: discordProfile.verified,
                        locale: discordProfile.locale,
                        avatar: discordProfile.avatar,
                        banner: discordProfile.banner,
                        accent_color: discordProfile.accent_color,
                        premium_type: discordProfile.premium_type,
                        public_flags: discordProfile.public_flags,
                    };

                    console.log('🎮 Discord userData prepared:', {
                        discordUsername: userData.discordUsername,
                        discordVerified: userData.discordVerified,
                        hasProviderData: !!userData.providerData
                    });
                }

                if (!existingUser) {
                    // Create user in our custom model
                    console.log('➕ Creating new user with data:', userData);
                    existingUser = await User.create(userData);
                    console.log(`✅ Created new ${account.provider} user: ${user.email}`, {
                        id: existingUser._id,
                        provider: account.provider,
                        discordData: account.provider === 'discord' ? userData.providerData : undefined
                    });
                } else {
                    // Update existing user info
                    existingUser.name = user.name || existingUser.name;
                    existingUser.image = user.image || existingUser.image;

                    // Update Discord-specific fields if this is a Discord login
                    if (account.provider === 'discord' && profile) {
                        const discordProfile = profile as any;
                        console.log('🔄 Updating existing user with Discord data...');

                        existingUser.discordUsername = discordProfile.username;
                        existingUser.discordDiscriminator = discordProfile.discriminator;
                        existingUser.discordGlobalName = discordProfile.global_name;
                        existingUser.discordVerified = discordProfile.verified;
                        existingUser.discordLocale = discordProfile.locale;
                        existingUser.providerData = userData.providerData;
                    }

                    await existingUser.save();
                    console.log(`✅ Updated existing ${account.provider} user: ${user.email}`);
                }

                return true;
            } catch (error) {
                console.error('❌ Error during sign in:', error);
                console.error('❌ Error stack:', (error as Error).stack);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            // Persist user info in JWT token
            if (user && account) {
                try {
                    await connectDB();

                    // Find our user in the database to get the MongoDB ObjectId
                    const dbUser = await User.findOne({
                        $or: [
                            { email: user.email },
                            { provider: account.provider, providerId: account.providerAccountId }
                        ]
                    });

                    if (dbUser) {
                        token.id = dbUser._id.toString(); // Use our MongoDB ObjectId
                        token.email = dbUser.email;
                        token.name = dbUser.name;
                        token.image = dbUser.image;
                        token.provider = dbUser.provider;
                    }
                } catch (error) {
                    console.error('Error in JWT callback:', error);
                    // Fallback to original values if database lookup fails
                    token.id = user.id;
                    token.email = user.email;
                    token.name = user.name;
                    token.image = user.image;
                    token.provider = account.provider as 'github' | 'google' | 'discord';
                }
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
                session.user.provider = token.provider as 'github' | 'google' | 'discord';
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};