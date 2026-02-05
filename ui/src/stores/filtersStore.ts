import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ClaimFilters, UserFilters, AnalyticsFilters, STORAGE_KEYS } from './types';

interface FiltersState {
  // Filter states for different pages
  claimFilters: ClaimFilters;
  userFilters: UserFilters;
  analyticsFilters: AnalyticsFilters;
  
  // Actions for claim filters
  setClaimFilters: (filters: Partial<ClaimFilters>) => void;
  resetClaimFilters: () => void;
  updateClaimFilter: <K extends keyof ClaimFilters>(key: K, value: ClaimFilters[K]) => void;
  
  // Actions for user filters
  setUserFilters: (filters: Partial<UserFilters>) => void;
  resetUserFilters: () => void;
  updateUserFilter: <K extends keyof UserFilters>(key: K, value: UserFilters[K]) => void;
  
  // Actions for analytics filters
  setAnalyticsFilters: (filters: Partial<AnalyticsFilters>) => void;
  resetAnalyticsFilters: () => void;
  updateAnalyticsFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  
  // Utility actions
  clearAllFilters: () => void;
  hasActiveFilters: (page: 'claims' | 'users' | 'analytics') => boolean;
}

const defaultClaimFilters: ClaimFilters = {
  status: [],
  dateRange: { startDate: null, endDate: null },
  payerIds: [],
  hospitalIds: [],
  amountRange: { min: null, max: null },
  searchQuery: '',
};

const defaultUserFilters: UserFilters = {
  role: [],
  status: [],
  hospitalIds: [],
  searchQuery: '',
};

const defaultAnalyticsFilters: AnalyticsFilters = {
  dateRange: { startDate: null, endDate: null },
  tenantIds: [],
  hospitalIds: [],
  payerIds: [],
  claimTypes: [],
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      // Initial state
      claimFilters: defaultClaimFilters,
      userFilters: defaultUserFilters,
      analyticsFilters: defaultAnalyticsFilters,
      
      // Claim filter actions
      setClaimFilters: (filters) => set((state) => ({
        claimFilters: { ...state.claimFilters, ...filters }
      })),
      
      resetClaimFilters: () => set({ claimFilters: defaultClaimFilters }),
      
      updateClaimFilter: (key, value) => set((state) => ({
        claimFilters: { ...state.claimFilters, [key]: value }
      })),
      
      // User filter actions
      setUserFilters: (filters) => set((state) => ({
        userFilters: { ...state.userFilters, ...filters }
      })),
      
      resetUserFilters: () => set({ userFilters: defaultUserFilters }),
      
      updateUserFilter: (key, value) => set((state) => ({
        userFilters: { ...state.userFilters, [key]: value }
      })),
      
      // Analytics filter actions
      setAnalyticsFilters: (filters) => set((state) => ({
        analyticsFilters: { ...state.analyticsFilters, ...filters }
      })),
      
      resetAnalyticsFilters: () => set({ analyticsFilters: defaultAnalyticsFilters }),
      
      updateAnalyticsFilter: (key, value) => set((state) => ({
        analyticsFilters: { ...state.analyticsFilters, [key]: value }
      })),
      
      // Utility actions
      clearAllFilters: () => set({
        claimFilters: defaultClaimFilters,
        userFilters: defaultUserFilters,
        analyticsFilters: defaultAnalyticsFilters,
      }),
      
      hasActiveFilters: (page) => {
        const state = get();
        switch (page) {
          case 'claims':
            return Object.values(state.claimFilters).some(value => {
              if (Array.isArray(value)) return value.length > 0;
              if (typeof value === 'string') return value.trim() !== '';
              if (value && typeof value === 'object') {
                return Object.values(value).some(v => v !== null && v !== undefined);
              }
              return false;
            });
          case 'users':
            return Object.values(state.userFilters).some(value => {
              if (Array.isArray(value)) return value.length > 0;
              if (typeof value === 'string') return value.trim() !== '';
              return false;
            });
          case 'analytics':
            return Object.values(state.analyticsFilters).some(value => {
              if (Array.isArray(value)) return value.length > 0;
              if (value && typeof value === 'object') {
                return Object.values(value).some(v => v !== null && v !== undefined);
              }
              return false;
            });
          default:
            return false;
        }
      },
    }),
    {
      name: STORAGE_KEYS.FILTERS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);