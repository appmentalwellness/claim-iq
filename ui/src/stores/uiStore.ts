import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SidebarState, STORAGE_KEYS } from './types';

interface UIState extends SidebarState {
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Modal states
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // Page states
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      collapsed: false,
      mobileOpen: false,
      isLoading: false,
      activeModal: null,
      currentPage: 'dashboard',
      
      // Sidebar actions
      toggleSidebar: () => set((state) => ({ 
        collapsed: !state.collapsed 
      })),
      
      setSidebarCollapsed: (collapsed: boolean) => set({ collapsed }),
      
      toggleMobileSidebar: () => set((state) => ({ 
        mobileOpen: !state.mobileOpen 
      })),
      
      setMobileSidebarOpen: (open: boolean) => set({ mobileOpen: open }),
      
      // Loading actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      // Modal actions
      openModal: (modalId: string) => set({ activeModal: modalId }),
      
      closeModal: () => set({ activeModal: null }),
      
      // Page actions
      setCurrentPage: (page: string) => set({ currentPage: page }),
    }),
    {
      name: STORAGE_KEYS.SIDEBAR,
      storage: createJSONStorage(() => localStorage),
      // Only persist sidebar state, not loading/modal states
      partialize: (state) => ({
        collapsed: state.collapsed,
        currentPage: state.currentPage,
      }),
    }
  )
);