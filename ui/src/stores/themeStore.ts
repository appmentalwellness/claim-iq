import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ThemeMode, ThemeColors, STORAGE_KEYS } from './types';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setColors: (colors: Partial<ThemeColors>) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetTheme: () => void;
  
  // Computed
  isDarkMode: () => boolean;
  getEffectiveTheme: () => 'light' | 'dark';
}

const defaultColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#f59e0b',
};

const defaultTheme = {
  mode: 'system' as ThemeMode,
  colors: defaultColors,
  fontSize: 'medium' as const,
  reducedMotion: false,
  highContrast: false,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      ...defaultTheme,
      
      setThemeMode: (mode) => {
        set({ mode });
        applyThemeToDocument(get());
      },
      
      setColors: (colors) => set((state) => {
        const newColors = { ...state.colors, ...colors };
        const newState = { ...state, colors: newColors };
        applyThemeToDocument(newState);
        return { colors: newColors };
      }),
      
      setFontSize: (fontSize) => {
        set({ fontSize });
        applyThemeToDocument(get());
      },
      
      toggleReducedMotion: () => set((state) => {
        const newState = { ...state, reducedMotion: !state.reducedMotion };
        applyThemeToDocument(newState);
        return { reducedMotion: !state.reducedMotion };
      }),
      
      toggleHighContrast: () => set((state) => {
        const newState = { ...state, highContrast: !state.highContrast };
        applyThemeToDocument(newState);
        return { highContrast: !state.highContrast };
      }),
      
      resetTheme: () => {
        set(defaultTheme);
        applyThemeToDocument(defaultTheme);
      },
      
      isDarkMode: () => {
        const state = get();
        if (state.mode === 'dark') return true;
        if (state.mode === 'light') return false;
        // System preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      },
      
      getEffectiveTheme: () => {
        const state = get();
        if (state.mode === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return state.mode === 'dark' ? 'dark' : 'light';
      },
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state);
        }
      },
    }
  )
);

// Apply theme to document
function applyThemeToDocument(state: Pick<ThemeState, 'mode' | 'colors' | 'fontSize' | 'reducedMotion' | 'highContrast'>) {
  const root = document.documentElement;
  
  // Determine effective theme
  let effectiveTheme: 'light' | 'dark';
  if (state.mode === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    effectiveTheme = state.mode === 'dark' ? 'dark' : 'light';
  }
  
  // Apply theme mode
  root.classList.remove('light', 'dark');
  root.classList.add(effectiveTheme);
  
  // Apply custom colors
  root.style.setProperty('--color-primary', state.colors.primary);
  root.style.setProperty('--color-secondary', state.colors.secondary);
  root.style.setProperty('--color-accent', state.colors.accent);
  
  // Apply font size
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  root.style.setProperty('--font-size-base', fontSizeMap[state.fontSize]);
  
  // Apply accessibility preferences
  if (state.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
  
  if (state.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const state = useThemeStore.getState();
    if (state.mode === 'system') {
      applyThemeToDocument(state);
    }
  });
  
  // Apply theme on initial load
  const initialState = useThemeStore.getState();
  applyThemeToDocument(initialState);
}