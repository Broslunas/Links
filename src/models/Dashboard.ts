import mongoose, { Schema, Document } from 'mongoose';
import type {
    DashboardLayout,
    Widget,
    SharedPermission,
    WidgetType,
    WidgetPosition,
    WidgetSize,
    WidgetConfig,
    WidgetFilter
} from '../types/dashboard';

export interface IDashboard extends Document {
    userId: mongoose.Types.ObjectId;
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

// Widget Position Schema
const WidgetPositionSchema = new Schema<WidgetPosition>({
    x: {
        type: Number,
        required: true,
        min: 0,
    },
    y: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });

// Widget Size Schema
const WidgetSizeSchema = new Schema<WidgetSize>({
    width: {
        type: Number,
        required: true,
        min: 1,
        max: 12, // Assuming 12-column grid system
    },
    height: {
        type: Number,
        required: true,
        min: 1,
        max: 20, // Reasonable height limit
    },
    minWidth: {
        type: Number,
        min: 1,
        max: 12,
    },
    minHeight: {
        type: Number,
        min: 1,
        max: 20,
    },
}, { _id: false });

// Widget Filter Schema
const WidgetFilterSchema = new Schema<WidgetFilter>({
    field: {
        type: String,
        required: true,
        trim: true,
    },
    operator: {
        type: String,
        required: true,
        enum: ['equals', 'contains', 'greater', 'less', 'between'],
    },
    value: {
        type: Schema.Types.Mixed,
        required: true,
    },
}, { _id: false });

// Widget Config Schema
const WidgetConfigSchema = new Schema<WidgetConfig>({
    title: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    showHeader: {
        type: Boolean,
        default: true,
    },
    refreshInterval: {
        type: Number,
        min: 5000, // Minimum 5 seconds
        max: 3600000, // Maximum 1 hour
    },
    customStyles: {
        type: Schema.Types.Mixed,
        default: {},
    },
}, { _id: false });

// Widget Schema
const WidgetSchema = new Schema<Widget>({
    id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            'link-stats',
            'link-list',
            'analytics-chart',
            'quick-actions',
            'recent-activity',
            'top-performers'
        ] as WidgetType[],
    },
    position: {
        type: WidgetPositionSchema,
        required: true,
    },
    size: {
        type: WidgetSizeSchema,
        required: true,
    },
    config: {
        type: WidgetConfigSchema,
        default: () => ({ showHeader: true }),
    },
    filters: {
        type: [WidgetFilterSchema],
        default: [],
    },
}, { _id: false });

// Dashboard Layout Schema
const DashboardLayoutSchema = new Schema<DashboardLayout>({
    columns: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
        default: 12,
    },
    rows: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
        default: 20,
    },
    gap: {
        type: Number,
        required: true,
        min: 0,
        max: 50,
        default: 16,
    },
    responsive: {
        type: Boolean,
        default: true,
    },
}, { _id: false });

// Shared Permission Schema
const SharedPermissionSchema = new Schema<SharedPermission>({
    userId: {
        type: String,
        required: true,
    },
    permission: {
        type: String,
        required: true,
        enum: ['read', 'write'],
    },
    sharedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

// Main Dashboard Schema
const DashboardSchema = new Schema<IDashboard>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    layout: {
        type: DashboardLayoutSchema,
        default: () => ({
            columns: 12,
            rows: 20,
            gap: 16,
            responsive: true,
        }),
    },
    widgets: {
        type: [WidgetSchema],
        default: [],
        validate: {
            validator: function (widgets: Widget[]) {
                // Validate that widget IDs are unique within the dashboard
                const ids = widgets.map(w => w.id);
                return ids.length === new Set(ids).size;
            },
            message: 'Widget IDs must be unique within a dashboard',
        },
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    isShared: {
        type: Boolean,
        default: false,
    },
    sharedWith: {
        type: [SharedPermissionSchema],
        default: [],
    },
}, {
    timestamps: true,
});

// Indexes for performance optimization
DashboardSchema.index({ userId: 1 });
DashboardSchema.index({ userId: 1, createdAt: -1 });
DashboardSchema.index({ userId: 1, isDefault: 1 });
DashboardSchema.index({ isShared: 1 });
DashboardSchema.index({ 'sharedWith.userId': 1 });

// Ensure only one default dashboard per user
DashboardSchema.index(
    { userId: 1, isDefault: 1 },
    {
        unique: true,
        partialFilterExpression: { isDefault: true },
        name: 'unique_default_dashboard_per_user'
    }
);

// Pre-save middleware to validate widget positions don't overlap
DashboardSchema.pre('save', function (next) {
    const dashboard = this as IDashboard;

    // Check for widget position overlaps
    const widgets = dashboard.widgets;
    for (let i = 0; i < widgets.length; i++) {
        for (let j = i + 1; j < widgets.length; j++) {
            const widget1 = widgets[i];
            const widget2 = widgets[j];

            // Check if widgets overlap
            const w1Right = widget1.position.x + widget1.size.width;
            const w1Bottom = widget1.position.y + widget1.size.height;
            const w2Right = widget2.position.x + widget2.size.width;
            const w2Bottom = widget2.position.y + widget2.size.height;

            const overlaps = !(
                w1Right <= widget2.position.x ||
                widget1.position.x >= w2Right ||
                w1Bottom <= widget2.position.y ||
                widget1.position.y >= w2Bottom
            );

            if (overlaps) {
                return next(new Error(`Widgets ${widget1.id} and ${widget2.id} overlap`));
            }
        }
    }

    next();
});

const Dashboard = mongoose.models.Dashboard || mongoose.model<IDashboard>('Dashboard', DashboardSchema);

export default Dashboard;
export { Dashboard };