import React, { memo, useMemo, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useGalleryGrid } from '@/hooks/use-gallery-grid';
import { useGalleryMediaTracking } from '@/hooks/use-gallery-media-tracking';
import GalleryGridCell from './GalleryGridCell';
import { useMediaDates } from '@/hooks/use-media-dates';
import { MediaListResponse } from '@/types/gallery';
import { 
  calculateGridParameters,
  getScrollbarWidth
} from '@/utils/grid-utils';
import { useMonthNavigation } from '@/hooks/use-month-navigation';
import CurrentMonthBanner from './CurrentMonthBanner';
import { useGalleryContext } from '@/contexts/GalleryContext';
import { useIsMobile } from '@/hooks/use-media-query';

interface VirtualizedGalleryGridProps {
  mediaResponse: MediaListResponse;
  selectedIds: string[];
  onSelectId: (id: string, extendSelection: boolean) => void;
  columnsCount: number;
  viewMode?: 'single' | 'split';
  showDates?: boolean;
  position: 'source' | 'destination';
  gap?: number;
  onSetNavigationFunctions?: (fns: { prev: () => void, next: () => void, select: () => void }) => void;
  gridRef?: React.RefObject<any>;
  mobileViewMode?: GalleryViewMode;
  onToggleFullView?: () => void;
  filter?: string;
  onPreviewMedia?: (id: string) => void;
  onDeleteSelected?: () => void;
  currentMonthLabel?: string;
  onMonthSelect?: () => void;
  onCurrentMonthChange?: (label: string) => void;
  onDateIndexChange?: (dateIndex: { years: number[]; monthsByYear: Map<number, number[]> }) => void;
}

/**
 * A virtualized grid component that efficiently renders large collections of media items
 * With improved dimension calculations to prevent gaps and support for month/year separators
 */
const VirtualizedGalleryGrid = forwardRef<any, VirtualizedGalleryGridProps>(({
  mediaResponse,
  selectedIds,
  onSelectId,
  columnsCount = 5,
  viewMode = 'single',
  showDates = false,
  position = 'source',
  gap = 8,
  onSetNavigationFunctions,
  gridRef: externalGridRef,
  mobileViewMode,
  onToggleFullView,
  filter,
  onPreviewMedia,
  onDeleteSelected,
  currentMonthLabel,
  onMonthSelect,
  onCurrentMonthChange,
  onDateIndexChange
}, ref) => {
  const mediaIds = mediaResponse?.mediaIds || [];
  const isMobile = useIsMobile();
  
  // Obtenir le contexte pour accéder aux fonctions de persistance
  const galleryContext = useGalleryContext();
  
  // Déterminer la position et récupérer les valeurs et fonctions appropriées
  const persistedYearMonth = position === 'source' 
    ? galleryContext.sourceYearMonth 
    : galleryContext.destYearMonth;
    
  const updateYearMonth = position === 'source'
    ? galleryContext.updateSourceYearMonth
    : galleryContext.updateDestYearMonth;
  
  const {
    gridRef: internalGridRef,
    gridKey,
  } = useGalleryGrid();
  
  // Utiliser le gridRef externe s'il est fourni, sinon utiliser l'interne
  const effectiveGridRef = externalGridRef || internalGridRef;
  
  const { 
    dateIndex, 
    scrollToYearMonth, 
    enrichedGalleryItems,
    navigateToPreviousMonth,
    navigateToNextMonth,
    currentYearMonthLabel,
    updateCurrentYearMonthFromScroll,
    setExternalGridRef,
    currentYearMonth
  } = useMediaDates(
    mediaResponse, 
    columnsCount,
    position,
    persistedYearMonth,
    updateYearMonth
  );
  
  // Passer la référence de la grille au hook useMediaDates
  useEffect(() => {
    if (setExternalGridRef && effectiveGridRef) {
      setExternalGridRef(effectiveGridRef);
    }
  }, [effectiveGridRef, setExternalGridRef]);
  
  useGalleryMediaTracking(mediaResponse, effectiveGridRef);
  
  // Handlers pour la navigation mensuelle
  const handlePrevMonth = useCallback(() => {
    return navigateToPreviousMonth(effectiveGridRef);
  }, [navigateToPreviousMonth, effectiveGridRef]);
  
  const handleNextMonth = useCallback(() => {
    return navigateToNextMonth(effectiveGridRef);
  }, [navigateToNextMonth, effectiveGridRef]);

  const handleMonthSelect = useCallback(() => {
    if (onMonthSelect) onMonthSelect();
  }, [onMonthSelect]);

  // Forward les fonctions de navigation au parent (Gallery)
  useEffect(() => {
    if (onSetNavigationFunctions) {
      onSetNavigationFunctions({
        prev: handlePrevMonth,
        next: handleNextMonth,
        select: handleMonthSelect
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handlePrevMonth, handleNextMonth, handleMonthSelect, onSetNavigationFunctions]);

  // Utiliser le hook de navigation mensuelle pour les raccourcis clavier
  useMonthNavigation({
    navigateToPreviousMonth: handlePrevMonth,
    navigateToNextMonth: handleNextMonth
  });
  
  const scrollbarWidth = useMemo(() => getScrollbarWidth(), []);
  
  const handleSelectYearMonth = useCallback((year: number, month: number) => {
    scrollToYearMonth(year, month, effectiveGridRef);
    // Note: La persistance est gérée dans le hook useMediaDates
  }, [scrollToYearMonth, effectiveGridRef]);
  
  const rowCount = useMemo(() => {
    return Math.ceil(enrichedGalleryItems.length / columnsCount);
  }, [enrichedGalleryItems.length, columnsCount]);
  
  const calculateCellStyle = useCallback((
    originalStyle: React.CSSProperties, 
    columnIndex: number,
    isSeparator: boolean
  ): React.CSSProperties => {
    // Base style adjustments
    const baseStyle = {
      ...originalStyle,
      width: `${parseFloat(originalStyle.width as string) - gap}px`,
      height: `${parseFloat(originalStyle.height as string) - gap}px`,
      paddingRight: gap,
      paddingBottom: gap,
    };
    
    // Pour les séparateurs, étendre sur toute la largeur si nécessaire
    if (isSeparator) {
      return baseStyle;
    }
    
    return baseStyle;
  }, [gap]);
  
  // Gestionnaire de défilement pour mettre à jour le mois courant
  const handleScroll = useCallback(({ scrollTop }: { scrollTop: number }) => {
    // Mettre à jour le mois courant
    updateCurrentYearMonthFromScroll(scrollTop, effectiveGridRef);
  }, [updateCurrentYearMonthFromScroll, effectiveGridRef]);
  
  const itemData = useMemo(() => ({
    items: enrichedGalleryItems,
    selectedIds,
    onSelectId,
    showDates,
    position,
    columnsCount,
    gap,
    calculateCellStyle
  }), [enrichedGalleryItems, selectedIds, onSelectId, showDates, position, columnsCount, gap, calculateCellStyle]);
  
  const getItemKey = useCallback(({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) => {
    const index = rowIndex * columnsCount + columnIndex;
    if (index >= enrichedGalleryItems.length) {
      return `empty-${rowIndex}-${columnIndex}`;
    }
    
    const item = enrichedGalleryItems[index];
    if (item.type === 'separator') {
      return `separator-${item.yearMonth}`;
    }
    return `media-${item.id}`;
  }, [enrichedGalleryItems, columnsCount]);
  
  // Met à jour le mois courant dans le parent si besoin
  useEffect(() => {
    if (onCurrentMonthChange && currentYearMonthLabel) {
      onCurrentMonthChange(currentYearMonthLabel);
    }
  }, [onCurrentMonthChange, currentYearMonthLabel]);
  
  // Synchronisation du dateIndex dynamique avec le parent
  useEffect(() => {
    if (onDateIndexChange) {
      onDateIndexChange(dateIndex);
    }
  }, [dateIndex, onDateIndexChange]);
  
  useImperativeHandle(ref, () => ({
    scrollToYearMonth: (year: number, month: number) => {
      scrollToYearMonth(year, month, effectiveGridRef);
    },
    // On peut exposer d’autres méthodes si besoin
  }), [scrollToYearMonth, effectiveGridRef]);
  
  return (
    <div className="w-full h-full p-2 gallery-container relative">
      <AutoSizer key={`gallery-grid-${gridKey}`}>
        {({ height, width }) => {
          const { 
            itemWidth, 
            itemHeight
          } = calculateGridParameters(width, columnsCount, gap, showDates);
          
          const columnWidth = itemWidth + gap;
          
          return (
            <FixedSizeGrid
              ref={effectiveGridRef}
              columnCount={columnsCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight + gap}
              width={width}
              itemData={itemData}
              overscanRowCount={5}
              overscanColumnCount={2}
              itemKey={getItemKey}
              onScroll={handleScroll}
              className="scrollbar-hidden"
              style={{ 
                overflowX: 'hidden',
                scrollbarGutter: 'stable' as any
              }}
            >
              {GalleryGridCell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    </div>
  );
});

VirtualizedGalleryGrid.displayName = 'VirtualizedGalleryGrid';

// Exposer les nouveaux hooks pour la navigation mensuelle
export { useMonthNavigation };

export default VirtualizedGalleryGrid;
