import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';
import { useFiltersStore } from '../filtersStore';
import { useSelectionsStore } from '../selectionsStore';
import { useNotificationsStore } from '../notificationsStore';
import { useThemeStore } from '../themeStore';

describe('Zustand Stores', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useUIStore.getState().setSidebarCollapsed(false);
    useUIStore.getState().setCurrentPage('dashboard');
    useFiltersStore.getState().clearAllFilters();
    useSelectionsStore.getState().clearAllSelections();
    useNotificationsStore.getState().clearNotifications();
    useThemeStore.getState().resetTheme();
  });

  describe('UIStore', () => {
    it('should toggle sidebar state', () => {
      const store = useUIStore.getState();
      
      expect(store.collapsed).toBe(false);
      
      store.toggleSidebar();
      expect(useUIStore.getState().collapsed).toBe(true);
      
      store.toggleSidebar();
      expect(useUIStore.getState().collapsed).toBe(false);
    });

    it('should manage modal state', () => {
      const store = useUIStore.getState();
      
      expect(store.activeModal).toBe(null);
      
      store.openModal('test-modal');
      expect(useUIStore.getState().activeModal).toBe('test-modal');
      
      store.closeModal();
      expect(useUIStore.getState().activeModal).toBe(null);
    });

    it('should manage loading state', () => {
      const store = useUIStore.getState();
      
      expect(store.isLoading).toBe(false);
      
      store.setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);
      
      store.setLoading(false);
      expect(useUIStore.getState().isLoading).toBe(false);
    });
  });

  describe('FiltersStore', () => {
    it('should manage claim filters', () => {
      const store = useFiltersStore.getState();
      
      expect(store.claimFilters.searchQuery).toBe('');
      
      store.updateClaimFilter('searchQuery', 'test search');
      expect(useFiltersStore.getState().claimFilters.searchQuery).toBe('test search');
      
      store.resetClaimFilters();
      expect(useFiltersStore.getState().claimFilters.searchQuery).toBe('');
    });

    it('should detect active filters', () => {
      const store = useFiltersStore.getState();
      
      expect(store.hasActiveFilters('claims')).toBe(false);
      
      store.updateClaimFilter('searchQuery', 'test');
      expect(useFiltersStore.getState().hasActiveFilters('claims')).toBe(true);
      
      store.resetClaimFilters();
      expect(useFiltersStore.getState().hasActiveFilters('claims')).toBe(false);
    });
  });

  describe('SelectionsStore', () => {
    it('should manage claim selections', () => {
      const store = useSelectionsStore.getState();
      
      expect(store.claimSelections.selectedItems).toEqual([]);
      
      store.toggleClaimSelection('claim-1');
      expect(useSelectionsStore.getState().claimSelections.selectedItems).toContain('claim-1');
      
      store.toggleClaimSelection('claim-1');
      expect(useSelectionsStore.getState().claimSelections.selectedItems).not.toContain('claim-1');
    });

    it('should get selection count', () => {
      const store = useSelectionsStore.getState();
      
      expect(store.getSelectionCount('claims')).toBe(0);
      
      store.setClaimSelections(['claim-1', 'claim-2']);
      expect(useSelectionsStore.getState().getSelectionCount('claims')).toBe(2);
    });
  });

  describe('NotificationsStore', () => {
    it('should add and remove notifications', () => {
      const store = useNotificationsStore.getState();
      
      expect(store.notifications).toEqual([]);
      expect(store.unreadCount).toBe(0);
      
      store.addNotification({
        title: 'Test Notification',
        message: 'Test message',
        severity: 'info',
        type: {
          category: 'system',
          subcategory: 'test',
          priority: 1,
          autoExpire: false,
          requiresAcknowledgment: false,
        },
        actionRequired: false,
      });
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1);
      expect(state.notifications[0].title).toBe('Test Notification');
      
      store.markAsRead(state.notifications[0].id);
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      const store = useNotificationsStore.getState();
      
      // Add multiple notifications
      store.addNotification({
        title: 'Test 1',
        message: 'Message 1',
        severity: 'info',
        type: {
          category: 'system',
          subcategory: 'test',
          priority: 1,
          autoExpire: false,
          requiresAcknowledgment: false,
        },
        actionRequired: false,
      });
      
      store.addNotification({
        title: 'Test 2',
        message: 'Message 2',
        severity: 'warning',
        type: {
          category: 'system',
          subcategory: 'test',
          priority: 2,
          autoExpire: false,
          requiresAcknowledgment: false,
        },
        actionRequired: false,
      });
      
      expect(useNotificationsStore.getState().unreadCount).toBe(2);
      
      store.markAllAsRead();
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });
  });

  describe('ThemeStore', () => {
    it('should manage theme mode', () => {
      const store = useThemeStore.getState();
      
      expect(store.mode).toBe('system');
      
      store.setThemeMode('dark');
      expect(useThemeStore.getState().mode).toBe('dark');
      
      store.setThemeMode('light');
      expect(useThemeStore.getState().mode).toBe('light');
    });

    it('should manage accessibility preferences', () => {
      const store = useThemeStore.getState();
      
      expect(store.reducedMotion).toBe(false);
      expect(store.highContrast).toBe(false);
      
      store.toggleReducedMotion();
      expect(useThemeStore.getState().reducedMotion).toBe(true);
      
      store.toggleHighContrast();
      expect(useThemeStore.getState().highContrast).toBe(true);
    });

    it('should reset theme to defaults', () => {
      const store = useThemeStore.getState();
      
      // Modify theme
      store.setThemeMode('dark');
      store.toggleReducedMotion();
      store.setFontSize('large');
      
      // Reset
      store.resetTheme();
      const state = useThemeStore.getState();
      
      expect(state.mode).toBe('system');
      expect(state.reducedMotion).toBe(false);
      expect(state.fontSize).toBe('medium');
    });
  });
});