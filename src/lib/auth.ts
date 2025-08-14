import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import { connectDB } from './db-utils';
import { config } from './config';
import User from '../models/User';

// Debug configuration in development

// MongoDB client for NextAuth adapter
const client = new MongoClient(config.mongodb.uri);
const clientPromise = client.connect();

// Build providers array based on available configuration
const providers = [];

if (config.oauth.github.clientId && config.oauth.github.clientSecret) {
  providers.push(
    GithubProvider({
      clientId: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
    })
  );
}

if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  providers.push(
    GoogleProvider({
      clientId: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    // Remove custom callback page to use default NextAuth handling
  },
  callbacks: {
    async session({ session, user }) {
      // When using database sessions with adapter, user object is available
      if (session.user && user) {
        session.user.id = user.id;
        // Try to get provider info from our custom User model
        try {
          await connectDB();
          const customUser = await User.findOne({ email: session.user.email });
          if (customUser) {
            session.user.provider = customUser.provider;
          }
        } catch (error) {
          console.error('Error fetching user provider info:', error);
        }
      }
      return session;
    },
  },
  // Remove session strategy to use default database sessions with adapter
  secret: config.nextAuth.secret,
  // Add debug mode for development
  debug: process.env.NODE_ENV === 'development',
  // Add custom error handling and user sync
  events: {
    async signIn({ user, account, isNewUser }) {
      // Sync with our custom User model after successful sign in
      if (account && user.email) {
        try {
          await connectDB();
          const existingUser = await User.findOne({
            $or: [
              { email: user.email },
              {
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            ],
          });

          if (!existingUser) {
            await User.create({
              email: user.email,
              name: user.name || '',
              image: user.image,
              provider: account.provider as 'github' | 'google',
              providerId: account.providerAccountId,
            });
          } else {
            // Update existing user info if needed
            existingUser.name = user.name || existingUser.name;
            existingUser.image = user.image || existingUser.image;
            await existingUser.save();
          }
        } catch (error) {
          console.error('Error syncing custom user model:', error);
          // Don't fail the sign in process for this
        }
      }
    },
  },
};
