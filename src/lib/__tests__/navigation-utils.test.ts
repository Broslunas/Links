import {
    isDashboardRoute,
    isActiveNavItem,
    getActiveNavItem,
    shouldUseGlobalLayout,
    normalizePathname,
    isExternalLink,
    getLinkProps,
} from '../navigation-utils';
import { NavigationItem } from '@/types/navigation';

describe('Navigation Utils', () => {
    describe('isDashboardRoute', () => {
        it('should return true for dashboard routes', () => {
            expect(isDashboardRoute('/dashboard')).toBe(true);
            expect(isDashboardRoute('/dashboard/')).toBe(true);
            expect(isDashboardRoute('/dashboard/links')).toBe(true);
            expect(isDashboardRoute('/dashboard/analytics')).toBe(true);
        });

        it('should return false for non-dashboard routes', () => {
            expect(isDashboardRoute('/')).toBe(false);
            expect(isDashboardRoute('/features')).toBe(false);
            expect(isDashboardRoute('/pricing')).toBe(false);
            expect(isDashboardRoute('/api-docs')).toBe(false);
        });
    });

    describe('isActiveNavItem', () => {
        const homeItem: NavigationItem = { label: 'Home', href: '/' };
        const featuresItem: NavigationItem = { label: 'Features', href: '/features' };
        const pricingItem: NavigationItem = { label: 'Pricing', href: '/pricing' };

        it('should correctly identify active home page', () => {
            expect(isActiveNavItem(homeItem, '/')).toBe(true);
            expect(isActiveNavItem(homeItem, '/features')).toBe(false);
            expect(isActiveNavItem(homeItem, '/pricing')).toBe(false);
        });

        it('should correctly identify active feature pages', () => {
            expect(isActiveNavItem(featuresItem, '/features')).toBe(true);
            expect(isActiveNavItem(featuresItem, '/features/advanced')).toBe(true);
            expect(isActiveNavItem(featuresItem, '/')).toBe(false);
            expect(isActiveNavItem(featuresItem, '/pricing')).toBe(false);
        });

        it('should correctly identify active pricing pages', () => {
            expect(isActiveNavItem(pricingItem, '/pricing')).toBe(true);
            expect(isActiveNavItem(pricingItem, '/pricing/enterprise')).toBe(true);
            expect(isActiveNavItem(pricingItem, '/')).toBe(false);
            expect(isActiveNavItem(pricingItem, '/features')).toBe(false);
        });
    });

    describe('getActiveNavItem', () => {
        const navItems: NavigationItem[] = [
            { label: 'Home', href: '/' },
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
        ];

        it('should return the correct active item', () => {
            expect(getActiveNavItem(navItems, '/')?.label).toBe('Home');
            expect(getActiveNavItem(navItems, '/features')?.label).toBe('Features');
            expect(getActiveNavItem(navItems, '/pricing')?.label).toBe('Pricing');
        });

        it('should return null when no item is active', () => {
            expect(getActiveNavItem(navItems, '/unknown')).toBeNull();
        });
    });

    describe('shouldUseGlobalLayout', () => {
        it('should return true for non-dashboard routes', () => {
            expect(shouldUseGlobalLayout('/')).toBe(true);
            expect(shouldUseGlobalLayout('/features')).toBe(true);
            expect(shouldUseGlobalLayout('/pricing')).toBe(true);
            expect(shouldUseGlobalLayout('/api-docs')).toBe(true);
        });

        it('should return false for dashboard routes', () => {
            expect(shouldUseGlobalLayout('/dashboard')).toBe(false);
            expect(shouldUseGlobalLayout('/dashboard/')).toBe(false);
            expect(shouldUseGlobalLayout('/dashboard/links')).toBe(false);
        });
    });

    describe('normalizePathname', () => {
        it('should remove trailing slashes except for root', () => {
            expect(normalizePathname('/')).toBe('/');
            expect(normalizePathname('/features/')).toBe('/features');
            expect(normalizePathname('/pricing/')).toBe('/pricing');
        });

        it('should remove query parameters', () => {
            expect(normalizePathname('/features?tab=advanced')).toBe('/features');
            expect(normalizePathname('/pricing?plan=pro')).toBe('/pricing');
        });

        it('should remove hash fragments', () => {
            expect(normalizePathname('/features#section1')).toBe('/features');
            expect(normalizePathname('/pricing#plans')).toBe('/pricing');
        });

        it('should handle complex URLs', () => {
            expect(normalizePathname('/features/?tab=advanced#section1')).toBe('/features');
        });
    });

    describe('isExternalLink', () => {
        it('should identify external links by URL', () => {
            expect(isExternalLink({ label: 'Google', href: 'https://google.com' })).toBe(true);
            expect(isExternalLink({ label: 'Example', href: 'http://example.com' })).toBe(true);
        });

        it('should identify external links by flag', () => {
            expect(isExternalLink({ label: 'Status', href: '/status', external: true })).toBe(true);
        });

        it('should identify internal links', () => {
            expect(isExternalLink({ label: 'Features', href: '/features' })).toBe(false);
            expect(isExternalLink({ label: 'Home', href: '/' })).toBe(false);
        });
    });

    describe('getLinkProps', () => {
        it('should return correct props for external links', () => {
            const externalItem: NavigationItem = { label: 'Google', href: 'https://google.com' };
            const props = getLinkProps(externalItem);

            expect(props.href).toBe('https://google.com');
            expect(props.target).toBe('_blank');
            expect(props.rel).toBe('noopener noreferrer');
        });

        it('should return correct props for internal links', () => {
            const internalItem: NavigationItem = { label: 'Features', href: '/features' };
            const props = getLinkProps(internalItem);

            expect(props.href).toBe('/features');
            expect(props.target).toBeUndefined();
            expect(props.rel).toBeUndefined();
        });

        it('should handle external flag correctly', () => {
            const flaggedItem: NavigationItem = { label: 'Status', href: '/status', external: true };
            const props = getLinkProps(flaggedItem);

            expect(props.href).toBe('/status');
            expect(props.target).toBe('_blank');
            expect(props.rel).toBe('noopener noreferrer');
        });
    });
});