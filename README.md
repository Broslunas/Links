# URL Shortener

A modern URL shortener built with Next.js 14, TypeScript, and TailwindCSS.

## Features

- 🔗 Create short URLs with custom slugs
- 📊 Advanced analytics and statistics
- 🔐 OAuth authentication (GitHub & Google)
- 🌙 Dark/Light mode support
- 📱 Responsive design
- 🚀 Built with Next.js 14 App Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy environment variables:

   ```bash
   cp .env.local.example .env.local
   ```

4. Configure your environment variables in `.env.local`

5. Set up your MongoDB database (see Database Setup section below)

6. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

This project uses MongoDB Atlas as the database. The following models are configured:

### Models

- **User**: Stores user information from OAuth providers
- **Link**: Stores shortened URLs with metadata
- **AnalyticsEvent**: Stores click tracking data

### Database Connection

The database connection is managed through Mongoose with connection caching for optimal performance in serverless environments.

### Environment Variables

Required database environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/url-shortener
IP_HASH_SECRET=your-secret-key-for-ip-hashing
```

### Indexes

The following indexes are automatically created for performance:

- **User**: `email`, `providerId`, compound index on `provider + providerId`
- **Link**: `slug` (unique), `userId`, `userId + createdAt`, `isActive`, `isPublicStats`
- **AnalyticsEvent**: `linkId`, `linkId + timestamp`, `timestamp`, `country`, `device`, `browser`, `os`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Authentication pages
│   ├── (dashboard)/    # Dashboard pages
│   ├── api/           # API routes
│   ├── globals.css    # Global styles
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home page
├── components/         # React components
│   ├── features/      # Feature-specific components
│   ├── layout/        # Layout components
│   └── ui/           # Reusable UI components
├── lib/               # Utility functions
├── types/             # TypeScript type definitions
└── ...
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## License

MIT License
