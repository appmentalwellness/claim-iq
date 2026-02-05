import { create } from 'zustand';
import { SelectionState } from './types';

interface SelectionsState {
  // Selection states for different pages
  claimSelections: SelectionState;
  userSelections: SelectionState;
  documentSelections: SelectionState;
  
  // Actions for claim selections
  setClaimSelections: (selections: string[]) => void;
  toggleClaimSelection: (claimId: string) => void;
  selectAllClaims: (totalItems: number) => void;
  clearClaimSelections: () => void;
  
  // Actions for user selections
  setUserSelections: (selections: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  selectAllUsers: (totalItems: number) => void;
  clearUserSelections: () => void;
  
  // Actions for document selections
  setDocumentSelections: (selections: string[]) => void;
  toggleDocumentSelection: (documentId: string) => void;
  selectAllDocuments: (totalItems: number) => void;
  clearDocumentSelections: () => void;
  
  // Utility actions
  clearAllSelections: () => void;
  getSelectionCount: (type: 'claims' | 'users' | 'documents') => number;
  hasSelections: (type: 'claims' | 'users' | 'documents') => boolean;
}

const defaultSelectionState: SelectionState = {
  selectedItems: [],
  selectAll: false,
  totalItems: 0,
};

export const useSelectionsStore = create<SelectionsState>((set, get) => ({
  // Initial state
  claimSelections: defaultSelectionState,
  userSelections: defaultSelectionState,
  documentSelections: defaultSelectionState,
  
  // Claim selection actions
  setClaimSelections: (selections) => set((state) => ({
    claimSelections: {
      ...state.claimSelections,
      selectedItems: selections,
      selectAll: selections.length === state.claimSelections.totalItems && state.claimSelections.totalItems > 0,
    }
  })),
  
  toggleClaimSelection: (claimId) => set((state) => {
    const currentSelections = state.claimSelections.selectedItems;
    const isSelected = currentSelections.includes(claimId);
    const newSelections = isSelected
      ? currentSelections.filter(id => id !== claimId)
      : [...currentSelections, claimId];
    
    return {
      claimSelections: {
        ...state.claimSelections,
        selectedItems: newSelections,
        selectAll: newSelections.length === state.claimSelections.totalItems && state.claimSelections.totalItems > 0,
      }
    };
  }),
  
  selectAllClaims: (totalItems) => set((state) => {
    const selectAll = !state.claimSelections.selectAll;
    return {
      claimSelections: {
        selectedItems: selectAll ? Array.from({ length: totalItems }, (_, i) => `item-${i}`) : [],
        selectAll,
        totalItems,
      }
    };
  }),
  
  clearClaimSelections: () => set((state) => ({
    claimSelections: { ...defaultSelectionState, totalItems: state.claimSelections.totalItems }
  })),
  
  // User selection actions
  setUserSelections: (selections) => set((state) => ({
    userSelections: {
      ...state.userSelections,
      selectedItems: selections,
      selectAll: selections.length === state.userSelections.totalItems && state.userSelections.totalItems > 0,
    }
  })),
  
  toggleUserSelection: (userId) => set((state) => {
    const currentSelections = state.userSelections.selectedItems;
    const isSelected = currentSelections.includes(userId);
    const newSelections = isSelected
      ? currentSelections.filter(id => id !== userId)
      : [...currentSelections, userId];
    
    return {
      userSelections: {
        ...state.userSelections,
        selectedItems: newSelections,
        selectAll: newSelections.length === state.userSelections.totalItems && state.userSelections.totalItems > 0,
      }
    };
  }),
  
  selectAllUsers: (totalItems) => set((state) => {
    const selectAll = !state.userSelections.selectAll;
    return {
      userSelections: {
        selectedItems: selectAll ? Array.from({ length: totalItems }, (_, i) => `user-${i}`) : [],
        selectAll,
        totalItems,
      }
    };
  }),
  
  clearUserSelections: () => set((state) => ({
    userSelections: { ...defaultSelectionState, totalItems: state.userSelections.totalItems }
  })),
  
  // Document selection actions
  setDocumentSelections: (selections) => set((state) => ({
    documentSelections: {
      ...state.documentSelections,
      selectedItems: selections,
      selectAll: selections.length === state.documentSelections.totalItems && state.documentSelections.totalItems > 0,
    }
  })),
  
  toggleDocumentSelection: (documentId) => set((state) => {
    const currentSelections = state.documentSelections.selectedItems;
    const isSelected = currentSelections.includes(documentId);
    const newSelections = isSelected
      ? currentSelections.filter(id => id !== documentId)
      : [...currentSelections, documentId];
    
    return {
      documentSelections: {
        ...state.documentSelections,
        selectedItems: newSelections,
        selectAll: newSelections.length === state.documentSelections.totalItems && state.documentSelections.totalItems > 0,
      }
    };
  }),
  
  selectAllDocuments: (totalItems) => set((state) => {
    const selectAll = !state.documentSelections.selectAll;
    return {
      documentSelections: {
        selectedItems: selectAll ? Array.from({ length: totalItems }, (_, i) => `doc-${i}`) : [],
        selectAll,
        totalItems,
      }
    };
  }),
  
  clearDocumentSelections: () => set((state) => ({
    documentSelections: { ...defaultSelectionState, totalItems: state.documentSelections.totalItems }
  })),
  
  // Utility actions
  clearAllSelections: () => set({
    claimSelections: defaultSelectionState,
    userSelections: defaultSelectionState,
    documentSelections: defaultSelectionState,
  }),
  
  getSelectionCount: (type) => {
    const state = get();
    switch (type) {
      case 'claims':
        return state.claimSelections.selectedItems.length;
      case 'users':
        return state.userSelections.selectedItems.length;
      case 'documents':
        return state.documentSelections.selectedItems.length;
      default:
        return 0;
    }
  },
  
  hasSelections: (type) => {
    const state = get();
    switch (type) {
      case 'claims':
        return state.claimSelections.selectedItems.length > 0;
      case 'users':
        return state.userSelections.selectedItems.length > 0;
      case 'documents':
        return state.documentSelections.selectedItems.length > 0;
      default:
        return false;
    }
  },
}));