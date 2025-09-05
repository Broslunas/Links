import type {
  CreateDashboardData,
  UpdateDashboardData,
  CreateWidgetData,
  UpdateWidgetData,
  WidgetType,
  WidgetPosition,
  WidgetSize,
  WidgetFilter,
  DashboardLayout
} from '../types/dashboard';

// Validation utilities will be added here
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidSlug = (slug: string): boolean => {
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
};

// Dashboard validation functions
export const isValidDashboardName = (name: string): boolean => {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 100;
};

export const isValidDashboardDescription = (description?: string): boolean => {
  if (description === undefined) return true;
  return typeof description === 'string' && description.length <= 500;
};

export const isValidWidgetType = (type: string): type is WidgetType => {
  const validTypes: WidgetType[] = [
    'link-stats',
    'link-list',
    'analytics-chart',
    'quick-actions',
    'recent-activity',
    'top-performers'
  ];
  return validTypes.includes(type as WidgetType);
};

export const isValidWidgetPosition = (position: WidgetPosition): boolean => {
  return (
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    position.x >= 0 &&
    position.y >= 0 &&
    Number.isInteger(position.x) &&
    Number.isInteger(position.y)
  );
};

export const isValidWidgetSize = (size: WidgetSize): boolean => {
  const isValidDimension = (value: number, min: number, max: number) =>
    typeof value === 'number' && value >= min && value <= max && Number.isInteger(value);

  const validWidth = isValidDimension(size.width, 1, 12);
  const validHeight = isValidDimension(size.height, 1, 20);

  let validMinWidth = true;
  let validMinHeight = true;

  if (size.minWidth !== undefined) {
    validMinWidth = isValidDimension(size.minWidth, 1, 12) && size.minWidth <= size.width;
  }

  if (size.minHeight !== undefined) {
    validMinHeight = isValidDimension(size.minHeight, 1, 20) && size.minHeight <= size.height;
  }

  return validWidth && validHeight && validMinWidth && validMinHeight;
};

export const isValidWidgetFilter = (filter: WidgetFilter): boolean => {
  const validOperators = ['equals', 'contains', 'greater', 'less', 'between'];

  return (
    typeof filter.field === 'string' &&
    filter.field.trim().length > 0 &&
    validOperators.includes(filter.operator) &&
    filter.value !== undefined &&
    filter.value !== null
  );
};

export const isValidDashboardLayout = (layout: DashboardLayout): boolean => {
  return (
    typeof layout.columns === 'number' &&
    typeof layout.rows === 'number' &&
    typeof layout.gap === 'number' &&
    typeof layout.responsive === 'boolean' &&
    layout.columns >= 1 && layout.columns <= 12 &&
    layout.rows >= 1 && layout.rows <= 50 &&
    layout.gap >= 0 && layout.gap <= 50 &&
    Number.isInteger(layout.columns) &&
    Number.isInteger(layout.rows) &&
    Number.isInteger(layout.gap)
  );
};

export const validateCreateDashboardData = (data: CreateDashboardData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isValidDashboardName(data.name)) {
    errors.push('Dashboard name must be between 1 and 100 characters');
  }

  if (!isValidDashboardDescription(data.description)) {
    errors.push('Dashboard description must be 500 characters or less');
  }

  if (data.layout && !isValidDashboardLayout(data.layout as DashboardLayout)) {
    errors.push('Invalid dashboard layout configuration');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateDashboardData = (data: UpdateDashboardData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.name !== undefined && !isValidDashboardName(data.name)) {
    errors.push('Dashboard name must be between 1 and 100 characters');
  }

  if (data.description !== undefined && !isValidDashboardDescription(data.description)) {
    errors.push('Dashboard description must be 500 characters or less');
  }

  if (data.layout && !isValidDashboardLayout(data.layout as DashboardLayout)) {
    errors.push('Invalid dashboard layout configuration');
  }

  if (data.widgets) {
    // Validate widget IDs are unique
    const widgetIds = data.widgets.map(w => w.id);
    if (widgetIds.length !== new Set(widgetIds).size) {
      errors.push('Widget IDs must be unique within a dashboard');
    }

    // Validate each widget
    data.widgets.forEach((widget, index) => {
      if (!isValidWidgetType(widget.type)) {
        errors.push(`Invalid widget type at index ${index}`);
      }

      if (!isValidWidgetPosition(widget.position)) {
        errors.push(`Invalid widget position at index ${index}`);
      }

      if (!isValidWidgetSize(widget.size)) {
        errors.push(`Invalid widget size at index ${index}`);
      }

      if (widget.filters) {
        widget.filters.forEach((filter, filterIndex) => {
          if (!isValidWidgetFilter(filter)) {
            errors.push(`Invalid filter at widget ${index}, filter ${filterIndex}`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCreateWidgetData = (data: CreateWidgetData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isValidWidgetType(data.type)) {
    errors.push('Invalid widget type');
  }

  if (!isValidWidgetPosition(data.position)) {
    errors.push('Invalid widget position');
  }

  if (!isValidWidgetSize(data.size)) {
    errors.push('Invalid widget size');
  }

  if (data.filters) {
    data.filters.forEach((filter, index) => {
      if (!isValidWidgetFilter(filter)) {
        errors.push(`Invalid filter at index ${index}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateWidgetData = (data: UpdateWidgetData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.position && !isValidWidgetPosition(data.position)) {
    errors.push('Invalid widget position');
  }

  if (data.size && !isValidWidgetSize(data.size)) {
    errors.push('Invalid widget size');
  }

  if (data.filters) {
    data.filters.forEach((filter, index) => {
      if (!isValidWidgetFilter(filter)) {
        errors.push(`Invalid filter at index ${index}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
