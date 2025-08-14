import { NavigationItem } from '@/types/navigation';

/**
 * Determines if a route is a dashboard route
 * @param pathname - The current pathname
 * @returns true if the route is a dashboard route
 */
export function isDashboardRoute(pathname: string): boolean {
    return pathname.startsWith('/dashboard');
}

/**
 * Determines if a navigation item is currently active
 * @param item - The navigation item to check
 * @param currentPath - The current pathname
 * @returns true if the navigation item is active
 */
export function isActiveNavItem(item: NavigationItem, currentPath: string): boolean {
    // Exact match for home page
    if (item.href === '/' && currentPath === '/') {
        return true;
    }

    // For other pages, check if current path starts with the item href
    // but avoid matching home page for other routes
    if (item.href !== '/' && currentPath.startsWith(item.href)) {
        return true;
    }

    return false;
}

/**
 * Gets the active navigation item from a list of navigation items
 * @param items - Array of navigation items
 * @param currentPath - The current pathname
 * @returns The active navigation item or null if none is active
 */
export function getActiveNavItem(items: NavigationItem[], currentPath: string): NavigationItem | null {
    return items.find(item => isActiveNavItem(item, currentPath)) || null;
}

/**
 * Determines if the current route should use the global layout
 * @param pathname - The current pathname
 * @returns true if the route should use global layout
 */
export function shouldUseGlobalLayout(pathname: string): boolean {
    return !isDashboardRoute(pathname);
}

/**
 * Normalizes a pathname by removing trailing slashes and query parameters
 * @param pathname - The pathname to normalize
 * @returns The normalized pathname
 */
export function normalizePathname(pathname: string): string {
    // Remove query parameters and hash
    const cleanPath = pathname.split('?')[0].split('#')[0];

    // Remove trailing slash unless it's the root path
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        return cleanPath.slice(0, -1);
    }

    return cleanPath;
}

/**
 * Checks if a link is external (starts with http/https or has external flag)
 * @param item - The navigation item to check
 * @returns true if the link is external
 */
export function isExternalLink(item: NavigationItem): boolean {
    return item.external === true || item.href.startsWith('http://') || item.href.startsWith('https://');
}

/**
 * Gets the appropriate link props for a navigation item
 * @param item - The navigation item
 * @returns Object with href and target properties
 */
export function getLinkProps(item: NavigationItem) {
    const isExternal = isExternalLink(item);

    return {
        href: item.href,
        target: isExternal ? '_blank' : undefined,
        rel: isExternal ? 'noopener noreferrer' : undefined,
    };
}