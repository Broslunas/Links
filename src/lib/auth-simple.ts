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
        if (!account || !user.email) {
          return false;
        }

        await connectDB();

        // Check if user exists in our custom User model
        let existingUser = await User.findOne({
          $or: [
            { email: user.email },
            {
              provider: account.provider,
              providerId: account.providerAccountId,
            },
          ],
        });

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
        }

        if (!existingUser) {
          // Create user in our custom model
          existingUser = await User.create(userData);
        } else {
          // Update existing user info
          existingUser.name = user.name || existingUser.name;
          existingUser.image = user.image || existingUser.image;

          // Update Discord-specific fields if this is a Discord login
          if (account.provider === 'discord' && profile) {
            const discordProfile = profile as any;

            existingUser.discordUsername = discordProfile.username;
            existingUser.discordDiscriminator = discordProfile.discriminator;
            existingUser.discordGlobalName = discordProfile.global_name;
            existingUser.discordVerified = discordProfile.verified;
            existingUser.discordLocale = discordProfile.locale;
            existingUser.providerData = userData.providerData;
          }
        }

        return true;
      } catch (error) {
        console.error('❌ Error during sign in:', error);
        console.error('❌ Error stack:', (error as Error).stack);
        return false;
      }
    },
    async jwt({ token, user, account, trigger }) {
      // On initial sign in, persist user info in JWT token
      if (user && account) {
        try {
          await connectDB();

          // Find our user in the database to get the MongoDB ObjectId
          const dbUser = await User.findOne({
            $or: [
              { email: user.email },
              {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            ],
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
      
      // On session update or every request, refresh user data from database
      if (trigger === 'update' || (!user && token.email)) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.name = dbUser.name;
            token.image = dbUser.image;
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
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
        session.user.provider = token.provider as
          | 'github'
          | 'google'
          | 'discord';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
