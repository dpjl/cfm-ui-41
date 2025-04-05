
import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useGalleryGrid } from '@/hooks/use-gallery-grid';
import { useGalleryMediaTracking } from '@/hooks/use-gallery-media-tracking';
import GalleryGridCell from './GalleryGridCell';
import DateSelector from './DateSelector';
import { useMediaDates } from '@/hooks/use-media-dates';
import { MediaListResponse } from '@/types/gallery';
import { 
  calculateGridParameters,
  getScrollbarWidth
} from '@/utils/grid-utils';
import { useMonthNavigation } from '@/hooks/use-month-navigation';
import CurrentMonthBanner from './CurrentMonthBanner';

interface VirtualizedGalleryGridProps {
  mediaResponse: MediaListResponse;
  selectedIds: string[];
  onSelectId: (id: string, extendSelection: boolean) => void;
  columnsCount: number;
  viewMode?: 'single' | 'split';
  showDates?: boolean;
  position: 'source' | 'destination';
  gap?: number;
  onSetNavigationFunctions?: (prevFn: () => boolean, nextFn: () => boolean) => void;
  gridRef?: React.RefObject<any>;
}

/**
 * A virtualized grid component that efficiently renders large collections of media items
 * With improved dimension calculations to prevent gaps and support for month/year separators
 */
const VirtualizedGalleryGrid = memo(({
  mediaResponse,
  selectedIds,
  onSelectId,
  columnsCount = 5,
  viewMode = 'single',
  showDates = false,
  position = 'source',
  gap = 8,
  onSetNavigationFunctions,
  gridRef: externalGridRef
}: VirtualizedGalleryGridProps) => {
  const mediaIds = mediaResponse?.mediaIds || [];
  
  // Log enabler for debugging
  const logsEnabledRef = useRef<boolean>(true);
  
  // Debug log helper
  const debugLog = useCallback((message: string, data?: any) => {
    if (logsEnabledRef.current) {
      if (data) {
        console.log(`[VirtualizedGalleryGrid:${position}] ${message}`, data);
      } else {
        console.log(`[VirtualizedGalleryGrid:${position}] ${message}`);
      }
    }
  }, [position]);
  
  const {
    gridRef: internalGridRef,
    gridKey,
    scrollPositionRef
  } = useGalleryGrid();
  
  // Log the grid references
  useEffect(() => {
    debugLog(`Grid references - external: ${externalGridRef ? 'exists' : 'null'}, internal: ${internalGridRef ? 'exists' : 'null'}`);
  }, [externalGridRef, internalGridRef, debugLog]);
  
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
    setExternalGridRef // Nouvelle méthode utilisée pour passer la référence de la grille
  } = useMediaDates(mediaResponse, columnsCount);
  
  // Passer la référence de la grille au hook useMediaDates
  useEffect(() => {
    debugLog(`Setting external grid ref, ref exists: ${effectiveGridRef ? 'yes' : 'no'}`);
    
    if (setExternalGridRef) {
      setExternalGridRef(effectiveGridRef);
    }
    
    // Log grid properties if available
    if (effectiveGridRef?.current) {
      const gridProps = {
        columnCount: effectiveGridRef.current.props?.columnCount,
        rowCount: effectiveGridRef.current.props?.rowCount,
        rowHeight: effectiveGridRef.current.props?.rowHeight,
        width: effectiveGridRef.current.props?.width,
        height: effectiveGridRef.current.props?.height
      };
      debugLog('Current grid properties:', gridProps);
    }
  }, [effectiveGridRef, setExternalGridRef, debugLog]);
  
  useGalleryMediaTracking(mediaResponse, effectiveGridRef);
  
  // Handlers pour la navigation mensuelle
  const handlePrevMonth = useCallback(() => {
    debugLog('handlePrevMonth called');
    return navigateToPreviousMonth(effectiveGridRef);
  }, [navigateToPreviousMonth, effectiveGridRef, debugLog]);
  
  const handleNextMonth = useCallback(() => {
    debugLog('handleNextMonth called');
    return navigateToNextMonth(effectiveGridRef);
  }, [navigateToNextMonth, effectiveGridRef, debugLog]);
  
  // Utiliser le hook de navigation mensuelle pour les raccourcis clavier
  useMonthNavigation({
    navigateToPreviousMonth: handlePrevMonth,
    navigateToNextMonth: handleNextMonth
  });
  
  // Passer les fonctions de navigation au composant parent si nécessaire
  useEffect(() => {
    if (onSetNavigationFunctions) {
      debugLog('Setting navigation functions in parent');
      onSetNavigationFunctions(handlePrevMonth, handleNextMonth);
    }
  }, [handlePrevMonth, handleNextMonth, onSetNavigationFunctions, debugLog]);
  
  const scrollbarWidth = useMemo(() => getScrollbarWidth(), []);
  
  const handleSelectYearMonth = useCallback((year: number, month: number) => {
    debugLog(`handleSelectYearMonth called: ${year}-${month}`);
    scrollToYearMonth(year, month, effectiveGridRef);
  }, [scrollToYearMonth, effectiveGridRef, debugLog]);
  
  const rowCount = useMemo(() => {
    const count = Math.ceil(enrichedGalleryItems.length / columnsCount);
    debugLog(`Calculated rowCount: ${count} for ${enrichedGalleryItems.length} items with ${columnsCount} columns`);
    return count;
  }, [enrichedGalleryItems.length, columnsCount, debugLog]);
  
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
    // Stocker la position de défilement
    scrollPositionRef.current = scrollTop;
    
    debugLog(`handleScroll called with scrollTop=${scrollTop}`);
    
    // Mettre à jour le mois courant
    updateCurrentYearMonthFromScroll(scrollTop, effectiveGridRef);
  }, [scrollPositionRef, updateCurrentYearMonthFromScroll, effectiveGridRef, debugLog]);
  
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
  
  // Log when columnsCount changes
  useEffect(() => {
    debugLog(`columnsCount changed to ${columnsCount}`);
  }, [columnsCount, debugLog]);
  
  return (
    <div className="w-full h-full p-2 gallery-container relative">
      {/* Bandeau du mois courant */}
      <CurrentMonthBanner 
        currentMonth={currentYearMonthLabel}
        position={position}
      />
      
      <AutoSizer key={`gallery-grid-${gridKey}`}>
        {({ height, width }) => {
          debugLog(`AutoSizer dimensions: width=${width}, height=${height}`);
          
          const { 
            itemWidth, 
            itemHeight
          } = calculateGridParameters(width, columnsCount, gap, showDates);
          
          const columnWidth = itemWidth + gap;
          
          debugLog(`Grid parameters: itemWidth=${itemWidth}, itemHeight=${itemHeight}, columnWidth=${columnWidth}`);
          
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
              initialScrollTop={scrollPositionRef.current}
              className="scrollbar-vertical"
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
      
      {dateIndex.years.length > 0 && (
        <DateSelector
          years={dateIndex.years}
          monthsByYear={dateIndex.monthsByYear}
          onSelectYearMonth={handleSelectYearMonth}
          position={position}
        />
      )}
    </div>
  );
});

VirtualizedGalleryGrid.displayName = 'VirtualizedGalleryGrid';

// Exposer les nouveaux hooks pour la navigation mensuelle
export { useMonthNavigation };

export default VirtualizedGalleryGrid;

