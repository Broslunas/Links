// Dashboard-related TypeScript interfaces

export interface Dashboard {
    id: string;
    userId: string;
    name: string;
    description?: string;
    layout: DashboardLayout;
    widgets: Widget[];
    isDefault: boolean;
    isShared: boolean;
    sharedWith: SharedPermission[];
    createdAt: Date;
    updatedAt: Date;
}

export interface DashboardLayout {
    columns: number;
    rows: number;
    gap: number;
    responsive: boolean;
}

export interface Widget {
    id: string;
    type: WidgetType;
    position: WidgetPosition;
    size: WidgetSize;
    config: WidgetConfig;
    filters: WidgetFilter[];
}

export interface WidgetPosition {
    x: number;
    y: number;
}

export interface WidgetSize {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
}

export interface WidgetConfig {
    title?: string;
    showHeader: boolean;
    refreshInterval?: number;
    customStyles?: Record<string, any>;
}

export interface WidgetFilter {
    field: string;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
    value: any;
}

export interface SharedPermission {
    userId: string;
    permission: 'read' | 'write';
    sharedAt: Date;
}

export type WidgetType =
    | 'link-stats'
    | 'link-list'
    | 'analytics-chart'
    | 'quick-actions'
    | 'recent-activity'
    | 'top-performers';

// API-related types for dashboard operations
export interface CreateDashboardData {
    name: string;
    description?: string;
    layout?: Partial<DashboardLayout>;
    isDefault?: boolean;
}

export interface UpdateDashboardData {
    name?: string;
    description?: string;
    layout?: Partial<DashboardLayout>;
    widgets?: Widget[];
    isDefault?: boolean;
    isShared?: boolean;
    sharedWith?: SharedPermission[];
}

export interface CreateWidgetData {
    type: WidgetType;
    position: WidgetPosition;
    size: WidgetSize;
    config?: Partial<WidgetConfig>;
    filters?: WidgetFilter[];
}

export interface UpdateWidgetData {
    position?: WidgetPosition;
    size?: WidgetSize;
    config?: Partial<WidgetConfig>;
    filters?: WidgetFilter[];
}

// Widget-specific configuration types
export interface LinkStatsWidgetConfig extends WidgetConfig {
    timePeriod: 'day' | 'week' | 'month' | 'year';
    metrics: ('total_links' | 'total_clicks' | 'active_links' | 'inactive_links')[];
}

export interface LinkListWidgetConfig extends WidgetConfig {
    sortBy: 'createdAt' | 'updatedAt' | 'clickCount' | 'title';
    sortOrder: 'asc' | 'desc';
    showFields: ('title' | 'originalUrl' | 'clickCount' | 'createdAt' | 'isActive')[];
    itemsPerPage: number;
}

export interface AnalyticsChartWidgetConfig extends WidgetConfig {
    chartType: 'line' | 'bar' | 'donut' | 'pie';
    metric: 'clicks' | 'unique_clicks' | 'conversion_rate';
    timePeriod: 'day' | 'week' | 'month' | 'year';
    groupBy: 'day' | 'week' | 'month' | 'country' | 'device' | 'browser';
}

export interface QuickActionsWidgetConfig extends WidgetConfig {
    actions: ('create_link' | 'view_analytics' | 'export_data' | 'manage_links')[];
    buttonStyle: 'default' | 'outline' | 'ghost';
}

export interface RecentActivityWidgetConfig extends WidgetConfig {
    activityTypes: ('link_created' | 'link_clicked' | 'link_updated')[];
    itemCount: number;
    timePeriod: 'hour' | 'day' | 'week';
}

export interface TopPerformersWidgetConfig extends WidgetConfig {
    metric: 'clicks' | 'ctr' | 'unique_clicks';
    itemCount: number;
    timePeriod: 'day' | 'week' | 'month' | 'year';
}

// Dashboard context and state management types
export interface DashboardContextValue {
    dashboards: Dashboard[];
    currentDashboard: Dashboard | null;
    isEditing: boolean;
    widgets: Widget[];

    // Dashboard actions
    createDashboard: (data: CreateDashboardData) => Promise<Dashboard>;
    updateDashboard: (id: string, data: UpdateDashboardData) => Promise<Dashboard>;
    deleteDashboard: (id: string) => Promise<void>;
    setCurrentDashboard: (dashboard: Dashboard) => void;

    // Widget actions
    addWidget: (widget: CreateWidgetData) => void;
    updateWidget: (id: string, updates: UpdateWidgetData) => void;
    removeWidget: (id: string) => void;
    moveWidget: (id: string, position: WidgetPosition) => void;
    resizeWidget: (id: string, size: WidgetSize) => void;

    // UI state
    setIsEditing: (editing: boolean) => void;
}

// Error handling types
export interface DashboardError {
    code: string;
    message: string;
    details?: any;
}

export interface DashboardApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: DashboardError;
    timestamp: string;
}