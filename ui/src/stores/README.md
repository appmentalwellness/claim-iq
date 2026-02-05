# Zustand Stores Documentation

This directory contains the Zustand stores for managing UI state across the ClaimIQ application. The stores provide centralized state management with persistence, synchronization, and type safety.

## Store Overview

### 1. UI Store (`uiStore.ts`)
Manages general UI state including sidebar, modals, loading states, and page navigation.

**Features:**
- Sidebar collapse/expand state
- Mobile sidebar toggle
- Modal management
- Loading state management
- Current page tracking
- Persistent storage for sidebar preferences

**Usage:**
```typescript
import { useUIStore } from '@/stores';

const MyComponent = () => {
  const { collapsed, toggleSidebar, isLoading, setLoading } = useUIStore();
  
  return (
    <div>
      <button onClick={toggleSidebar}>
        {collapsed ? 'Expand' : 'Collapse'} Sidebar
      </button>
      {isLoading && <div>Loading...</div>}
    </div>
  );
};
```

### 2. Filters Store (`filtersStore.ts`)
Manages filter states for different pages (claims, users, analytics).

**Features:**
- Page-specific filter management
- Persistent filter storage
- Active filter detection
- Date range handling with proper serialization
- Reset functionality

**Usage:**
```typescript
import { useFiltersStore } from '@/stores';

const ClaimsPage = () => {
  const { claimFilters, updateClaimFilter, hasActiveFilters, resetClaimFilters } = useFiltersStore();
  
  return (
    <div>
      <input
        value={claimFilters.searchQuery || ''}
        onChange={(e) => updateClaimFilter('searchQuery', e.target.value)}
        placeholder="Search claims..."
      />
      {hasActiveFilters('claims') && (
        <button onClick={resetClaimFilters}>Clear Filters</button>
      )}
    </div>
  );
};
```

### 3. Selections Store (`selectionsStore.ts`)
Manages item selections for different pages (claims, users, documents).

**Features:**
- Multi-item selection management
- Select all functionality
- Selection count tracking
- Page-specific selections
- Bulk operations support

**Usage:**
```typescript
import { useSelectionsStore } from '@/stores';

const ClaimsList = () => {
  const { 
    claimSelections, 
    toggleClaimSelection, 
    selectAllClaims, 
    getSelectionCount 
  } = useSelectionsStore();
  
  return (
    <div>
      <button onClick={() => selectAllClaims(totalClaims)}>
        Select All ({getSelectionCount('claims')} selected)
      </button>
      {claims.map(claim => (
        <div key={claim.id}>
          <input
            type="checkbox"
            checked={claimSelections.selectedItems.includes(claim.id)}
            onChange={() => toggleClaimSelection(claim.id)}
          />
          {claim.name}
        </div>
      ))}
    </div>
  );
};
```

### 4. Notifications Store (`notificationsStore.ts`)
Manages application notifications and alerts.

**Features:**
- Real-time notification management
- Auto-expiring notifications
- Severity-based styling
- Read/unread tracking
- Category-based filtering
- Automatic cleanup

**Usage:**
```typescript
import { useNotificationsStore } from '@/stores';

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationsStore();
  
  return (
    <div>
      <h3>Notifications ({unreadCount} unread)</h3>
      <button onClick={markAllAsRead}>Mark All Read</button>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
};
```

### 5. Theme Store (`themeStore.ts`)
Manages application theme and accessibility preferences.

**Features:**
- Light/dark/system theme modes
- Custom color management
- Font size preferences
- Accessibility options (reduced motion, high contrast)
- Automatic system theme detection
- Persistent theme storage
- DOM manipulation for theme application

**Usage:**
```typescript
import { useThemeStore } from '@/stores';

const ThemeSelector = () => {
  const { 
    mode, 
    setThemeMode, 
    isDarkMode, 
    toggleReducedMotion, 
    reducedMotion 
  } = useThemeStore();
  
  return (
    <div>
      <select value={mode} onChange={(e) => setThemeMode(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <label>
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={toggleReducedMotion}
        />
        Reduce Motion
      </label>
    </div>
  );
};
```

## Custom Hooks

### `useSynchronizedState()`
Provides access to all stores with automatic synchronization between them.

```typescript
import { useSynchronizedState } from '@/stores/hooks';

const MyComponent = () => {
  const stores = useSynchronizedState();
  
  // Access any store
  const { ui, filters, selections, notifications, theme } = stores;
  
  return <div>Current page: {ui.currentPage}</div>;
};
```

### `usePageState(pageName)`
Manages page-specific state and automatically clears selections when navigating.

```typescript
import { usePageState } from '@/stores/hooks';

const ClaimsPage = () => {
  const { filters, selections } = usePageState('claims');
  
  // Page state is automatically managed
  return <div>Claims page content</div>;
};
```

### `useNotificationManager()`
Provides convenient methods for showing different types of notifications.

```typescript
import { useNotificationManager } from '@/stores/hooks';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotificationManager();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Success', 'Data saved successfully');
    } catch (error) {
      showError('Error', 'Failed to save data');
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
};
```

### `useResponsiveState()`
Manages responsive design state and automatically adjusts UI based on screen size.

```typescript
import { useResponsiveState } from '@/stores/hooks';

const ResponsiveComponent = () => {
  const { isMobile, isTablet, isDesktop } = useResponsiveState();
  
  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
};
```

## Persistence

The stores use Zustand's persistence middleware to save state to localStorage:

- **UI Store**: Saves sidebar and page preferences
- **Filters Store**: Saves all filter states with proper Date serialization
- **Theme Store**: Saves theme preferences and accessibility settings
- **Selections Store**: Not persisted (cleared on page navigation)
- **Notifications Store**: Not persisted (runtime only)

## State Synchronization

The stores are designed to work together:

1. **Page Navigation**: Automatically clears selections when changing pages
2. **Theme Changes**: Automatically applies theme to DOM elements
3. **Responsive Design**: Automatically adjusts sidebar state based on screen size
4. **Notifications**: Auto-cleanup expired notifications

## Type Safety

All stores are fully typed with TypeScript:

- Store state interfaces
- Action parameter types
- Return value types
- Generic filter and selection types

## Testing

The stores include comprehensive tests covering:

- State mutations
- Persistence behavior
- Synchronization logic
- Error handling
- Type safety

Run tests with:
```bash
npm test -- stores.test.ts
```

## Best Practices

1. **Use the appropriate store**: Don't put everything in one store
2. **Leverage custom hooks**: Use the provided hooks for common patterns
3. **Handle persistence carefully**: Be mindful of what should and shouldn't be persisted
4. **Use TypeScript**: Take advantage of the full type safety
5. **Test your usage**: Write tests for components that use the stores
6. **Clean up subscriptions**: Use the provided hooks to avoid memory leaks

## Performance Considerations

- Stores use shallow comparison for re-renders
- Persistence is debounced to avoid excessive localStorage writes
- Notifications auto-cleanup to prevent memory leaks
- Selections are cleared automatically to prevent large state objects