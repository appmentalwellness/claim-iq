import { create } from 'zustand';
import { Notification } from './types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  clearExpiredNotifications: () => void;
  
  // Getters
  getUnreadNotifications: () => Notification[];
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsBySeverity: (severity: string) => Notification[];
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notificationData) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: newNotifications.filter(n => !n.read).length,
      };
    });
    
    // Auto-expire notifications if they have an expiry date
    if (notification.expiresAt) {
      const timeUntilExpiry = notification.expiresAt.getTime() - Date.now();
      if (timeUntilExpiry > 0) {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, timeUntilExpiry);
      }
    }
    
    // Auto-expire notifications based on type
    if (notification.type.autoExpire) {
      const autoExpireTime = notification.severity === 'error' ? 10000 : 5000; // 10s for errors, 5s for others
      setTimeout(() => {
        get().removeNotification(notification.id);
      }, autoExpireTime);
    }
  },
  
  removeNotification: (id) => set((state) => {
    const newNotifications = state.notifications.filter(n => n.id !== id);
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read).length,
    };
  }),
  
  markAsRead: (id) => set((state) => {
    const newNotifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read).length,
    };
  }),
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  
  clearNotifications: () => set({
    notifications: [],
    unreadCount: 0,
  }),
  
  clearExpiredNotifications: () => set((state) => {
    const now = new Date();
    const newNotifications = state.notifications.filter(n => 
      !n.expiresAt || n.expiresAt > now
    );
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter(n => !n.read).length,
    };
  }),
  
  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.read);
  },
  
  getNotificationsByCategory: (category) => {
    return get().notifications.filter(n => n.type.category === category);
  },
  
  getNotificationsBySeverity: (severity) => {
    return get().notifications.filter(n => n.severity === severity);
  },
}));

// Auto-cleanup expired notifications every minute
setInterval(() => {
  useNotificationsStore.getState().clearExpiredNotifications();
}, 60000);