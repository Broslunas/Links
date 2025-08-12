// Global type definitions

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: 'github' | 'google';
  providerId: string;
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
  createdAt: Date;
  updatedAt: Date;
  clickCount: number;
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
  clicksByDay: Array<{ date: string; clicks: number }>;
  clicksByCountry: Array<{ country: string; clicks: number }>;
  clicksByDevice: Array<{ device: string; clicks: number }>;
  clicksByBrowser: Array<{ browser: string; clicks: number }>;
  clicksByOS: Array<{ os: string; clicks: number }>;
}
// NextAuth.js type extensions
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: 'github' | 'google';
    };
  }

  interface User {
    id: string;
    provider?: 'github' | 'google';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: 'github' | 'google';
  }
}