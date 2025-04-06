
import React, { createContext, useContext } from 'react';
import { GalleryViewMode, ViewModeType } from '@/types/gallery';
import { MediaFilter } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { useDirectoryState } from '@/hooks/core/use-directory-state';
import { useColumnsLayout } from '@/hooks/core/use-columns-layout';
import { useSelectionState } from '@/hooks/core/use-selection-state';
import { useUIPanelState } from '@/hooks/core/use-ui-panel-state';
import { useFilterState } from '@/hooks/core/use-filter-state';
import { useMediaOperations } from '@/hooks/core/use-media-operations';
import { useMutation } from '@tanstack/react-query';
import { usePersistedGalleryPosition } from '@/hooks/use-persisted-gallery-position';

// Interface du contexte
interface GalleryContextType {
  // Directory state
  selectedDirectoryIdLeft: string;
  selectedDirectoryIdRight: string;
  setSelectedDirectoryIdLeft: (id: string) => void;
  setSelectedDirectoryIdRight: (id: string) => void;
  
  // Column management
  getCurrentColumnsLeft: () => number;
  getCurrentColumnsRight: () => number;
  updateColumnCount: (side: 'left' | 'right', count: number) => void;
  getColumnValuesForViewMode?: (side: 'left' | 'right') => { [key: string]: number };
  
  // Selection state
  selectedIdsLeft: string[];
  selectedIdsRight: string[];
  setSelectedIdsLeft: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedIdsRight: React.Dispatch<React.SetStateAction<string[]>>;
  activeSide: 'left' | 'right';
  setActiveSide: React.Dispatch<React.SetStateAction<'left' | 'right'>>;
  selectionMode: 'single' | 'multiple';
  toggleSelectionMode: () => void;
  
  // UI state
  viewMode: GalleryViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<GalleryViewMode>>;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  closeBothSidebars: () => void;
  toggleFullView: (side: 'left' | 'right') => void;
  toggleServerPanel: () => void;
  
  // Filters
  leftFilter: MediaFilter;
  rightFilter: MediaFilter;
  setLeftFilter: React.Dispatch<React.SetStateAction<MediaFilter>>;
  setRightFilter: React.Dispatch<React.SetStateAction<MediaFilter>>;
  
  // Dialog state
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  serverPanelOpen: boolean;
  setServerPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Actions
  handleRefresh: () => void;
  handleDeleteSelected: (side: 'left' | 'right') => void;
  handleDelete: () => void;
  handleDownloadMedia: (id: string, position: 'source' | 'destination') => Promise<void>;
  handleDownloadSelected: (ids: string[], position: 'source' | 'destination') => Promise<void>;
  deleteMutation: ReturnType<typeof useMutation>;
  
  // Utilities
  isMobile: boolean;
  getViewModeType: (side: 'left' | 'right') => ViewModeType;
  
  // Persistance des positions
  sourceYearMonth: string | null;
  destYearMonth: string | null;
  updateSourceYearMonth: (yearMonth: string | null, immediate?: boolean) => void;
  updateDestYearMonth: (yearMonth: string | null, immediate?: boolean) => void;
}

// Création du contexte
const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export function useGalleryContext() {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error('useGalleryContext must be used within a GalleryProvider');
  }
  return context;
}

// Provider component
export const GalleryProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const isMobile = useIsMobile();
  
  // Utiliser les hooks de base
  const directoryState = useDirectoryState();
  const selectionState = useSelectionState({ initialSelectionMode: 'single' });
  const uiState = useUIPanelState();
  const filterState = useFilterState();
  const columnsLayout = useColumnsLayout();
  
  // Nouveau hook pour la persistance des positions
  const persistedPositions = usePersistedGalleryPosition();
  
  // Extraire les états des hooks
  const { selectedIdsLeft, selectedIdsRight, activeSide, setActiveSide, setSelectedIdsLeft, setSelectedIdsRight, selectionMode, toggleSelectionMode } = selectionState;
  const { viewMode, setViewMode, leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel, closeBothSidebars, toggleFullView, deleteDialogOpen, setDeleteDialogOpen, serverPanelOpen, setServerPanelOpen, toggleServerPanel } = uiState;
  const { leftFilter, setLeftFilter, rightFilter, setRightFilter } = filterState;
  
  // Media operations
  const mediaOperations = useMediaOperations(
    selectedIdsLeft,
    selectedIdsRight,
    activeSide,
    setSelectedIdsLeft,
    setSelectedIdsRight,
    setDeleteDialogOpen
  );
  
  // Méthodes pour obtenir le nombre de colonnes
  const getCurrentColumnsLeft = () => columnsLayout.getCurrentColumnsLeft(viewMode);
  const getCurrentColumnsRight = () => columnsLayout.getCurrentColumnsRight(viewMode);
  
  // Méthode pour mettre à jour le nombre de colonnes
  const updateColumnCount = (side: 'left' | 'right', count: number) => {
    columnsLayout.updateColumnCount(side, viewMode, count);
  };
  
  // Fonction pour obtenir le type de mode de vue
  const getViewModeType = (side: 'left' | 'right'): ViewModeType => {
    return columnsLayout.getViewModeType(viewMode) as ViewModeType;
  };
  
  // Valeur du contexte
  const value: GalleryContextType = {
    // Directory state
    ...directoryState,
    
    // Column management
    getCurrentColumnsLeft,
    getCurrentColumnsRight,
    updateColumnCount,
    getColumnValuesForViewMode: (side: 'left' | 'right') => {
      const viewModeType = getViewModeType(side);
      return {
        'desktop': side === 'left' ? columnsLayout.getCurrentColumnsLeft(viewMode) : columnsLayout.getCurrentColumnsRight(viewMode),
        'desktop-single': side === 'left' ? columnsLayout.getCurrentColumnsLeft(viewMode) : columnsLayout.getCurrentColumnsRight(viewMode),
        'mobile-split': side === 'left' ? columnsLayout.getCurrentColumnsLeft(viewMode) : columnsLayout.getCurrentColumnsRight(viewMode),
        'mobile-single': side === 'left' ? columnsLayout.getCurrentColumnsLeft(viewMode) : columnsLayout.getCurrentColumnsRight(viewMode)
      };
    },
    
    // Selection state
    selectedIdsLeft,
    setSelectedIdsLeft,
    selectedIdsRight,
    setSelectedIdsRight,
    activeSide,
    setActiveSide,
    selectionMode,
    toggleSelectionMode,
    
    // UI state
    viewMode,
    setViewMode,
    leftPanelOpen,
    rightPanelOpen,
    toggleLeftPanel,
    toggleRightPanel,
    closeBothSidebars,
    toggleFullView,
    toggleServerPanel,
    
    // Filters
    leftFilter,
    setLeftFilter,
    rightFilter,
    setRightFilter,
    
    // Dialog state
    deleteDialogOpen,
    setDeleteDialogOpen,
    serverPanelOpen,
    setServerPanelOpen,
    
    // Actions
    ...mediaOperations,
    
    // Utilities
    isMobile,
    getViewModeType,
    
    // Persistance des positions
    sourceYearMonth: persistedPositions.sourceYearMonth,
    destYearMonth: persistedPositions.destYearMonth,
    updateSourceYearMonth: persistedPositions.updateSourcePosition,
    updateDestYearMonth: persistedPositions.updateDestPosition
  };
  
  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};
