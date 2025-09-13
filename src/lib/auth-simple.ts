import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import TwitchProvider from 'next-auth/providers/twitch';
import { connectDB } from './db-utils';
import User from '../models/User';
import { sendSubscriptionWebhook } from './newsletter-webhook';

export const authOptions: NextAuthOptions = {
  // Use JWT strategy instead of database adapter to avoid connection issues
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - only update session once per day
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  useSecureCookies: process.env.NODE_ENV === 'production',
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
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
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
          provider: account.provider as 'github' | 'google' | 'discord' | 'twitch',
          providerId: account.providerAccountId,
        };

        // Store minimal provider-specific data to reduce database size
        if (account.provider === 'discord' && profile) {
          const discordProfile = profile as any;
          userData.discordUsername = discordProfile.username;
          userData.discordGlobalName = discordProfile.global_name;
        }

        if (account.provider === 'twitch' && profile) {
          const twitchProfile = profile as any;
          userData.twitchUsername = twitchProfile.login;
          userData.twitchDisplayName = twitchProfile.display_name;
        }

        if (!existingUser) {
          // Create user in our custom model with default preferences
          userData.defaultPublicStats = false; // Default to private stats
          userData.emailNotifications = true; // Subscribe to newsletter by default
          existingUser = await User.create(userData);

          // Send newsletter subscription webhook for new users
          try {
            await sendSubscriptionWebhook(userData.name || 'Usuario', userData.email);
          } catch (error) {
            console.error('Error sending newsletter webhook for new user:', error);
            // Don't fail the authentication if webhook fails
          }
        } else {
          // Update existing user info
          existingUser.name = user.name || existingUser.name;
          existingUser.image = user.image || existingUser.image;

          // Update minimal provider-specific fields
          if (account.provider === 'discord' && profile) {
            const discordProfile = profile as any;
            existingUser.discordUsername = discordProfile.username;
            existingUser.discordGlobalName = discordProfile.global_name;
          }

          if (account.provider === 'twitch' && profile) {
            // Twitch-specific data can be stored in providerData if needed
            const twitchProfile = profile as any;
            existingUser.providerData = {
              ...existingUser.providerData,
              username: twitchProfile.login,
              // Store display_name in a compatible field or extend the type
              ...(twitchProfile.display_name && { avatar: twitchProfile.display_name })
            } as any;
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
      // On initial sign in, store minimal data in JWT token to reduce cookie size
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
            // Store only essential data to minimize cookie size
            token.id = dbUser._id?.toString() || '';
            token.email = dbUser.email;
            token.role = dbUser.role || 'user';
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
          // Fallback to minimal data
          token.id = user.id;
          token.email = user.email;
          token.role = 'user';
          token.lastUpdated = Date.now();
        }
      }

      // Only refresh role on explicit update trigger
      if (trigger === 'update' && token.email && !user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.role = dbUser.role || 'user';
            token.lastUpdated = Date.now();
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT callback:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Fetch user data from database for session to minimize JWT size
      if (token && token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id);

          if (dbUser) {
            session.user.id = token.id as string;
            session.user.email = token.email as string;
            session.user.name = dbUser.name || '';
            session.user.image = dbUser.image || '';
            session.user.provider = dbUser.provider;
            session.user.role = (token.role as 'user' | 'admin') || 'user';
          }
        } catch (error) {
          console.error('Error fetching user data for session:', error);
          // Fallback to token data
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = '';
          session.user.image = '';
          session.user.provider = 'github'; // Default fallback
          session.user.role = (token.role as 'user' | 'admin') || 'user';
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
