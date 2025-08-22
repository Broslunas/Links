// Global type definitions

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: 'github' | 'google' | 'discord';
  providerId: string;
  // Discord-specific fields
  discordUsername?: string;
  discordDiscriminator?: string;
  discordGlobalName?: string;
  discordVerified?: boolean;
  discordLocale?: string;
  // Additional provider data
  providerData?: {
    username?: string;
    discriminator?: string;
    global_name?: string;
    verified?: boolean;
    locale?: string;
    avatar?: string;
    banner?: string;
    accent_color?: number;
    premium_type?: number;
    public_flags?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Link {
  id: string;
  userId: string;
  originalUrl: string;
  slug: string;
  title?: string;
  description?: string;
  isPublicStats: boolean;
  isActive: boolean;
  isDisabledByAdmin?: boolean;
  disabledReason?: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsEvent {
  id: string;
  linkId: string;
  timestamp: Date;
  ip: string; // Hashed for privacy
  country: string;
  city: string;
  region: string;
  language: string;
  userAgent: string;
  device: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  referrer?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Database-related types
export interface CreateLinkData {
  originalUrl: string;
  slug?: string;
  title?: string;
  description?: string;
  isPublicStats?: boolean;
}

export interface CreateLinkResponse extends Link {
  shortUrl: string;
}

export interface UpdateLinkData {
  originalUrl?: string;
  slug?: string;
  title?: string;
  description?: string;
  isPublicStats?: boolean;
  isActive?: boolean;
}

export interface AnalyticsData {
  country: string;
  city: string;
  region: string;
  language: string;
  userAgent: string;
  device: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  referrer?: string;
}

export interface LinkStats {
  totalClicks: number;
  uniqueClicks?: number;
  clicksByDay: Array<{ date: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: Array<{ device: string; clicks: number }>;
  clicksByBrowser: Array<{ browser: string; clicks: number }>;
  clicksByOS: Array<{ os: string; clicks: number }>;
  clicksByReferrer: Array<{ referrer: string; clicks: number }>;
  peakHours?: Array<{ hour: number; clicks: number }>;
}

export interface TempLink {
  id: string;
  originalUrl: string;
  slug: string;
  token: string;
  title?: string;
  description?: string;
  clickCount: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTempLinkData {
  originalUrl: string;
  slug?: string;
  title?: string;
  description?: string;
}

export interface CreateTempLinkResponse extends TempLink {
  shortUrl: string;
}
// NextAuth.js type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: 'github' | 'google' | 'discord';
      role?: 'user' | 'admin';
    };
  }

  interface User {
    id: string;
    provider?: 'github' | 'google' | 'discord';
    role?: 'user' | 'admin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: 'github' | 'google' | 'discord';
    role?: 'user' | 'admin';
  }
}

// Re-export navigation types
export * from './navigation';

// Re-export API v1 types
export * from './api-v1';