// Store-related types
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  relatedEntity?: EntityReference;
  expiresAt?: Date;
}

export interface NotificationType {
  category: 'claim' | 'system' | 'user' | 'workflow';
  subcategory: string;
  priority: number;
  autoExpire: boolean;
  requiresAcknowledgment: boolean;
}

export interface EntityReference {
  type: 'claim' | 'user' | 'hospital' | 'payer';
  id: string;
  name?: string;
}

// Filter types for different pages
export interface ClaimFilters {
  status?: string[];
  dateRange?: DateRange;
  payerIds?: string[];
  hospitalIds?: string[];
  amountRange?: AmountRange;
  searchQuery?: string;
}

export interface UserFilters {
  role?: string[];
  status?: string[];
  hospitalIds?: string[];
  searchQuery?: string;
}

export interface AnalyticsFilters {
  dateRange?: DateRange;
  tenantIds?: string[];
  hospitalIds?: string[];
  payerIds?: string[];
  claimTypes?: string[];
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface AmountRange {
  min: number | null;
  max: number | null;
}

// Selection types
export interface SelectionState {
  selectedItems: string[];
  selectAll: boolean;
  totalItems: number;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

// UI State types
export interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
}

// Persistent storage keys
export const STORAGE_KEYS = {
  THEME: 'claimiq-theme',
  SIDEBAR: 'claimiq-sidebar',
  FILTERS: 'claimiq-filters',
  USER_PREFERENCES: 'claimiq-user-preferences',
} as const;