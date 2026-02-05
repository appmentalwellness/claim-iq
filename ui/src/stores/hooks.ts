import { useEffect, useCallback } from 'react';
import { useUIStore } from './uiStore';
import { useFiltersStore } from './filtersStore';
import { useSelectionsStore } from './selectionsStore';
import { useNotificationsStore } from './notificationsStore';
import { useThemeStore } from './themeStore';

// Custom hook for synchronized state management
export const useSynchronizedState = () => {
  const uiStore = useUIStore();
  const filtersStore = useFiltersStore();
  const selectionsStore = useSelectionsStore();
  const notificationsStore = useNotificationsStore();
  const themeStore = useThemeStore();
  
  // Synchronize page changes with selections clearing
  useEffect(() => {
    let previousPage = useUIStore.getState().currentPage;
    
    const unsubscribe = useUIStore.subscribe((state) => {
      if (state.currentPage !== previousPage) {
        // Clear selections when navigating between pages
        selectionsStore.clearAllSelections();
        previousPage = state.currentPage;
      }
    });
    
    return unsubscribe;
  }, [selectionsStore]);
  
  // Synchronize theme changes with system preferences
  useEffect(() => {
    const handleSystemThemeChange = () => {
      if (themeStore.mode === 'system') {
        // Theme store will automatically handle this via its internal listener
        // This is just for any additional synchronization if needed
      }
    };
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themeStore.mode]);
  
  return {
    ui: uiStore,
    filters: filtersStore,
    selections: selectionsStore,
    notifications: notificationsStore,
    theme: themeStore,
  };
};

// Hook for managing page-specific state
export const usePageState = (pageName: string) => {
  const { setCurrentPage } = useUIStore();
  const { clearAllSelections } = useSelectionsStore();
  
  useEffect(() => {
    setCurrentPage(pageName);
    // Clear selections when entering a new page
    clearAllSelections();
  }, [pageName, setCurrentPage, clearAllSelections]);
  
  const getPageFilters = useCallback(() => {
    const filtersStore = useFiltersStore.getState();
    switch (pageName) {
      case 'claims':
        return filtersStore.claimFilters;
      case 'users':
        return filtersStore.userFilters;
      case 'analytics':
        return filtersStore.analyticsFilters;
      default:
        return {};
    }
  }, [pageName]);
  
  const getPageSelections = useCallback(() => {
    const selectionsStore = useSelectionsStore.getState();
    switch (pageName) {
      case 'claims':
        return selectionsStore.claimSelections;
      case 'users':
        return selectionsStore.userSelections;
      case 'documents':
        return selectionsStore.documentSelections;
      default:
        return { selectedItems: [], selectAll: false, totalItems: 0 };
    }
  }, [pageName]);
  
  return {
    filters: getPageFilters(),
    selections: getPageSelections(),
  };
};

// Hook for managing notifications with auto-cleanup
export const useNotificationManager = () => {
  const { addNotification, removeNotification, clearExpiredNotifications } = useNotificationsStore();
  
  // Auto-cleanup expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      clearExpiredNotifications();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [clearExpiredNotifications]);
  
  const showSuccess = useCallback((title: string, message: string) => {
    addNotification({
      title,
      message,
      severity: 'success',
      type: {
        category: 'system',
        subcategory: 'success',
        priority: 1,
        autoExpire: true,
        requiresAcknowledgment: false,
      },
      actionRequired: false,
    });
  }, [addNotification]);
  
  const showError = useCallback((title: string, message: string, actionRequired = false) => {
    addNotification({
      title,
      message,
      severity: 'error',
      type: {
        category: 'system',
        subcategory: 'error',
        priority: 3,
        autoExpire: false,
        requiresAcknowledgment: true,
      },
      actionRequired,
    });
  }, [addNotification]);
  
  const showWarning = useCallback((title: string, message: string) => {
    addNotification({
      title,
      message,
      severity: 'warning',
      type: {
        category: 'system',
        subcategory: 'warning',
        priority: 2,
        autoExpire: true,
        requiresAcknowledgment: false,
      },
      actionRequired: false,
    });
  }, [addNotification]);
  
  const showInfo = useCallback((title: string, message: string) => {
    addNotification({
      title,
      message,
      severity: 'info',
      type: {
        category: 'system',
        subcategory: 'info',
        priority: 1,
        autoExpire: true,
        requiresAcknowledgment: false,
      },
      actionRequired: false,
    });
  }, [addNotification]);
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
  };
};

// Hook for responsive design state management
export const useResponsiveState = () => {
  const { collapsed, mobileOpen, setSidebarCollapsed, setMobileSidebarOpen } = useUIStore();
  
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;
      
      if (isMobile && !collapsed) {
        setSidebarCollapsed(true);
      } else if (!isMobile && !isTablet && collapsed) {
        setSidebarCollapsed(false);
      }
      
      // Close mobile sidebar on resize to desktop
      if (!isMobile && mobileOpen) {
        setMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount
    
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsed, mobileOpen, setSidebarCollapsed, setMobileSidebarOpen]);
  
  return {
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  };
};