
import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { DetailedMediaInfo } from '@/api/imageApi';
import { useGalleryGrid } from '@/hooks/use-gallery-grid';
import { useGalleryMediaTracking } from '@/hooks/use-gallery-media-tracking';
import GalleryGridCell from './GalleryGridCell';
import DateSelector from './DateSelector';
import { useMediaDates } from '@/hooks/use-media-dates';
import { MediaListResponse, GalleryItem } from '@/types/gallery';
import { 
  calculateGridParameters,
  getScrollbarWidth
} from '@/utils/grid-utils';
import { useMonthNavigation } from '@/hooks/use-month-navigation';

interface VirtualizedGalleryGridProps {
  mediaResponse: MediaListResponse;
  selectedIds: string[];
  onSelectId: (id: string, extendSelection: boolean) => void;
  columnsCount: number;
  viewMode?: 'single' | 'split';
  showDates?: boolean;
  updateMediaInfo?: (id: string, info: DetailedMediaInfo) => void;
  position: 'source' | 'destination';
  gap?: number;
  onNavigateMonth?: (direction: 'prev' | 'next') => void;
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
  updateMediaInfo,
  position = 'source',
  gap = 8,
  onNavigateMonth,
  onSetNavigationFunctions,
  gridRef: externalGridRef
}: VirtualizedGalleryGridProps) => {
  const mediaIds = mediaResponse?.mediaIds || [];
  
  const {
    gridRef: internalGridRef,
    gridKey,
    scrollPositionRef
  } = useGalleryGrid();
  
  // Utiliser le gridRef externe s'il est fourni, sinon utiliser l'interne
  const effectiveGridRef = externalGridRef || internalGridRef;
  
  const { 
    dateIndex, 
    scrollToYearMonth, 
    enrichedGalleryItems,
    navigateToPreviousMonth,
    navigateToNextMonth
  } = useMediaDates(mediaResponse, columnsCount);
  
  useGalleryMediaTracking(mediaResponse, effectiveGridRef);
  
  // Handlers pour la navigation mensuelle
  const handlePrevMonth = useCallback(() => {
    const success = navigateToPreviousMonth(effectiveGridRef);
    if (success && onNavigateMonth) {
      onNavigateMonth('prev');
    }
    return success;
  }, [navigateToPreviousMonth, effectiveGridRef, onNavigateMonth]);
  
  const handleNextMonth = useCallback(() => {
    const success = navigateToNextMonth(effectiveGridRef);
    if (success && onNavigateMonth) {
      onNavigateMonth('next');
    }
    return success;
  }, [navigateToNextMonth, effectiveGridRef, onNavigateMonth]);
  
  // Utiliser le hook de navigation mensuelle pour les raccourcis clavier
  useMonthNavigation({
    navigateToPreviousMonth: handlePrevMonth,
    navigateToNextMonth: handleNextMonth
  });
  
  // Passer les fonctions de navigation au composant parent si nécessaire
  useEffect(() => {
    if (onSetNavigationFunctions) {
      onSetNavigationFunctions(handlePrevMonth, handleNextMonth);
    }
  }, [handlePrevMonth, handleNextMonth, onSetNavigationFunctions]);
  
  const scrollbarWidth = useMemo(() => getScrollbarWidth(), []);
  
  const handleSelectYearMonth = useCallback((year: number, month: number) => {
    scrollToYearMonth(year, month, effectiveGridRef);
  }, [scrollToYearMonth, effectiveGridRef]);
  
  const rowCount = useMemo(() => {
    return Math.ceil(enrichedGalleryItems.length / columnsCount);
  }, [enrichedGalleryItems.length, columnsCount]);
  
  const calculateCellStyle = useCallback((
    originalStyle: React.CSSProperties, 
    columnIndex: number,
    isSeparator: boolean
  ): React.CSSProperties => {
    return {
      ...originalStyle,
      width: `${parseFloat(originalStyle.width as string) - gap}px`,
      height: `${parseFloat(originalStyle.height as string) - gap}px`,
      paddingRight: gap,
      paddingBottom: gap,
    };
  }, [gap]);
  
  const itemData = useMemo(() => ({
    items: enrichedGalleryItems,
    selectedIds,
    onSelectId,
    showDates,
    updateMediaInfo,
    position,
    columnsCount,
    gap,
    calculateCellStyle
  }), [enrichedGalleryItems, selectedIds, onSelectId, showDates, updateMediaInfo, position, columnsCount, gap, calculateCellStyle]);
  
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
  
  return (
    <div className="w-full h-full p-2 gallery-container relative">
      <AutoSizer key={`gallery-grid-${gridKey}`}>
        {({ height, width }) => {
          const { 
            itemWidth, 
            itemHeight
          } = calculateGridParameters(width, columnsCount, gap, showDates);
          
          const columnWidth = itemWidth + gap;
          
          const adjustedWidth = width - scrollbarWidth + 1;
          
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
              onScroll={({ scrollTop }) => {
                scrollPositionRef.current = scrollTop;
              }}
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
