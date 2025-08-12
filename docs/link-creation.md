# Link Creation Functionality

## Overview

The link creation functionality allows authenticated users to create shortened URLs with optional custom slugs and metadata.

## Components

### LinkCreator Component

Located at `src/components/features/LinkCreator.tsx`

**Features:**
- URL validation and sanitization
- Custom slug validation with collision detection
- Optional metadata (title, description)
- Public statistics toggle
- Real-time form validation
- Success/error feedback with toast notifications
- Advanced options toggle

**Props:**
- `onLinkCreated?: (link: any) => void` - Callback when link is successfully created
- `onError?: (error: string) => void` - Callback when an error occurs

### API Endpoint

Located at `src/app/api/links/route.ts`

**POST /api/links**

Creates a new shortened link for the authenticated user.

**Request Body:**
```typescript
{
  originalUrl: string;        // Required: URL to shorten
  slug?: string;             // Optional: Custom slug
  title?: string;            // Optional: Link title (max 200 chars)
  description?: string;      // Optional: Link description (max 500 chars)
  isPublicStats?: boolean;   // Optional: Allow public stats viewing
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    id: string;
    userId: string;
    originalUrl: string;
    slug: string;
    title?: string;
    description?: string;
    isPublicStats: boolean;
    isActive: boolean;
    clickCount: number;
    createdAt: Date;
    updatedAt: Date;
    shortUrl: string;        // Full shortened URL
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## Validation Rules

### URL Validation
- Must be a valid URL format
- Automatically adds `https://` if no protocol specified
- Validates the final URL after sanitization

### Slug Validation
- Only lowercase letters, numbers, hyphens, and underscores allowed
- Maximum 50 characters
- Minimum 1 character
- Must be unique across all links
- Auto-generated if not provided (6 characters by default)

### Metadata Validation
- Title: Maximum 200 characters
- Description: Maximum 500 characters

## Slug Generation Algorithm

1. **Custom Slug**: If provided, validates format and checks for uniqueness
2. **Auto-generation**: Creates random 6-character slug using `[a-z0-9]`
3. **Collision Detection**: If slug exists, tries with increasing length (up to 10 attempts)
4. **Fallback**: Uses timestamp-based suffix if all attempts fail

## Error Handling

### Client-side
- Real-time form validation
- Toast notifications for success/error states
- Specific error messages for different validation failures

### Server-side
- Authentication verification
- Input validation and sanitization
- Database constraint handling
- Proper HTTP status codes

## Security Features

- Authentication required for all operations
- Input sanitization and validation
- SQL injection prevention through Mongoose ODM
- Rate limiting (to be implemented in task 13)

## Testing

- Unit tests for slug generation and URL validation
- Integration tests for API endpoint validation
- Component tests for form validation (to be added in task 14)

## Usage Example

```tsx
import { LinkCreator } from '../components/features';
import { useToast } from '../hooks/useToast';

function MyComponent() {
  const { success, error } = useToast();

  const handleLinkCreated = (link) => {
    success(`Link created: ${link.shortUrl}`);
  };

  const handleError = (errorMessage) => {
    error(errorMessage);
  };

  return (
    <LinkCreator 
      onLinkCreated={handleLinkCreated}
      onError={handleError}
    />
  );
}
```