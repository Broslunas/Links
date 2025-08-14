# Navigation Utilities

This module provides navigation configuration and utilities for the global layout system.

## Files

- `navigation.ts` - Main navigation configuration data
- `navigation-utils.ts` - Utility functions for navigation and routing
- `types/navigation.ts` - TypeScript interfaces for navigation

## Usage

### Navigation Configuration

```typescript
import { mainNavigation, footerNavigation } from '@/lib/navigation';

// Main header navigation
const headerItems = mainNavigation.items;

// Footer sections and company info
const footerSections = footerNavigation.sections;
const companyInfo = footerNavigation.companyInfo;
```

### Navigation Utilities

```typescript
import {
  isDashboardRoute,
  isActiveNavItem,
  shouldUseGlobalLayout,
  normalizePathname,
  getLinkProps
} from '@/lib/navigation-utils';

// Check if current route is dashboard
const isDashboard = isDashboardRoute('/dashboard/links'); // true

// Check if navigation item is active
const isActive = isActiveNavItem(
  { label: 'Features', href: '/features' },
  '/features/advanced'
); // true

// Determine layout to use
const useGlobal = shouldUseGlobalLayout('/pricing'); // true

// Get proper link props for external/internal links
const linkProps = getLinkProps({
  label: 'Status',
  href: 'https://status.example.com'
}); // { href: '...', target: '_blank', rel: 'noopener noreferrer' }
```

### Types

```typescript
import type {
  NavigationItem,
  NavigationSection,
  GlobalLayoutProps,
  LayoutContext
} from '@/types/navigation';
```

## Key Features

- **Route Detection**: Automatically detect dashboard vs external routes
- **Active State Management**: Determine which navigation items are active
- **External Link Handling**: Proper props for external links
- **Path Normalization**: Clean up URLs for consistent comparison
- **Type Safety**: Full TypeScript support with proper interfaces

## Testing

All utilities are thoroughly tested. Run tests with:

```bash
npm test -- --testPathPatterns="navigation"
```