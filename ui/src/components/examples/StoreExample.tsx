import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useFiltersStore } from '../../stores/filtersStore';
import { useSelectionsStore } from '../../stores/selectionsStore';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useThemeStore } from '../../stores/themeStore';
import { useSynchronizedState, useNotificationManager } from '../../stores/hooks';

/**
 * Example component demonstrating how to use the Zustand stores
 * This component shows basic usage patterns for all stores
 */
export const StoreExample: React.FC = () => {
  // Individual store usage
  const { collapsed, toggleSidebar, isLoading, setLoading } = useUIStore();
  const { claimFilters, updateClaimFilter, hasActiveFilters } = useFiltersStore();
  const { claimSelections, toggleClaimSelection, getSelectionCount } = useSelectionsStore();
  const { notifications, unreadCount } = useNotificationsStore();
  const { mode, setThemeMode, isDarkMode } = useThemeStore();
  
  // Synchronized state usage
  const stores = useSynchronizedState();
  
  // Notification manager usage
  const { showSuccess, showError, showWarning, showInfo } = useNotificationManager();
  
  const handleTestNotifications = () => {
    showSuccess('Success!', 'This is a success notification');
    showError('Error!', 'This is an error notification');
    showWarning('Warning!', 'This is a warning notification');
    showInfo('Info', 'This is an info notification');
  };
  
  const handleTestLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Zustand Stores Example</h2>
      
      {/* UI Store Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">UI Store</h3>
        <div className="space-y-2">
          <p>Sidebar collapsed: {collapsed ? 'Yes' : 'No'}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <div className="space-x-2">
            <button
              onClick={toggleSidebar}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle Sidebar
            </button>
            <button
              onClick={handleTestLoading}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Loading
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters Store Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Filters Store</h3>
        <div className="space-y-2">
          <p>Search Query: "{claimFilters.searchQuery}"</p>
          <p>Has Active Filters: {hasActiveFilters('claims') ? 'Yes' : 'No'}</p>
          <input
            type="text"
            placeholder="Search claims..."
            value={claimFilters.searchQuery || ''}
            onChange={(e) => updateClaimFilter('searchQuery', e.target.value)}
            className="px-3 py-1 border rounded w-full max-w-xs"
          />
        </div>
      </div>
      
      {/* Selections Store Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Selections Store</h3>
        <div className="space-y-2">
          <p>Selected Claims: {getSelectionCount('claims')}</p>
          <p>Selected Items: {claimSelections.selectedItems.join(', ') || 'None'}</p>
          <div className="space-x-2">
            {['claim-1', 'claim-2', 'claim-3'].map((claimId) => (
              <button
                key={claimId}
                onClick={() => toggleClaimSelection(claimId)}
                className={`px-3 py-1 rounded ${
                  claimSelections.selectedItems.includes(claimId)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {claimId}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Notifications Store Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Notifications Store</h3>
        <div className="space-y-2">
          <p>Total Notifications: {notifications.length}</p>
          <p>Unread Count: {unreadCount}</p>
          <button
            onClick={handleTestNotifications}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Notifications
          </button>
        </div>
      </div>
      
      {/* Theme Store Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Theme Store</h3>
        <div className="space-y-2">
          <p>Current Mode: {mode}</p>
          <p>Is Dark Mode: {isDarkMode() ? 'Yes' : 'No'}</p>
          <div className="space-x-2">
            {(['light', 'dark', 'system'] as const).map((themeMode) => (
              <button
                key={themeMode}
                onClick={() => setThemeMode(themeMode)}
                className={`px-3 py-1 rounded capitalize ${
                  mode === themeMode
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {themeMode}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Synchronized State Example */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Synchronized State</h3>
        <div className="space-y-2">
          <p>Current Page: {stores.ui.currentPage}</p>
          <p>Theme Mode: {stores.theme.mode}</p>
          <p>Notifications: {stores.notifications.notifications.length}</p>
        </div>
      </div>
    </div>
  );
};