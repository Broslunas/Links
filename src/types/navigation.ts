// Navigation-related type definitions

export interface NavigationItem {
    label: string;
    href: string;
    external?: boolean;
}

export interface NavigationSection {
    title: string;
    items: NavigationItem[];
}

export interface GlobalLayoutProps {
    children: React.ReactNode;
}

export interface GlobalHeaderProps {
    currentPath?: string;
}

export interface GlobalFooterProps {
    className?: string;
}

export interface ConditionalLayoutProps {
    children: React.ReactNode;
}

export interface LayoutContext {
    currentPath: string;
    isAuthenticated: boolean;
    user?: import('./index').User;
}

// Navigation configuration types
export interface MainNavigation {
    items: NavigationItem[];
}

export interface FooterNavigation {
    sections: NavigationSection[];
    companyInfo: {
        name: string;
        description: string;
        logo?: string;
    };
    copyright: {
        year: number;
        text: string;
    };
}