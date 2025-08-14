# Layout Components

This directory contains the layout components for the Broslunas Links application.

## ConditionalLayout

The `ConditionalLayout` component is responsible for automatically determining which layout to apply based on the current route:

- **Dashboard routes** (`/dashboard/*`): Uses `DashboardLayout`
- **All other routes**: Uses `GlobalLayout`

### Usage

```tsx
import { ConditionalLayout } from '@/components/layout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConditionalLayout>
      {children}
    </ConditionalLayout>
  );
}
```

### Route Detection Logic

The component uses Next.js `usePathname()` hook to detect the current route:

```tsx
const pathname = usePathname();
const isDashboardRoute = pathname.startsWith('/dashboard');
```

### Layout Components

- **DashboardLayout**: Provides sidebar navigation, user menu, and dashboard-specific UI
- **GlobalLayout**: Provides global header with navigation and footer for public pages

### Testing

The component includes comprehensive tests covering:
- Dashboard route detection
- External route detection  
- Edge cases (empty paths, similar route names)
- Layout transitions
- Content preservation

Run tests with:
```bash
npm test -- --testPathPatterns="ConditionalLayout"
```

## Architecture

```
ConditionalLayout
├── DashboardLayout (for /dashboard/*)
│   ├── Sidebar
│   ├── Header (dashboard-specific)
│   └── Main content area
└── GlobalLayout (for all other routes)
    ├── GlobalHeader
    ├── Main content area
    └── GlobalFooter
```

This architecture ensures:
1. Automatic layout application without code duplication
2. Clean separation between dashboard and public layouts
3. Easy maintenance and updates to global elements
4. Consistent user experience across the application