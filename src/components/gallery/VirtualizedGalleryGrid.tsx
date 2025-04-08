
import React, { useRef, useCallback } from 'react';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import GalleryGridCell from './GalleryGridCell';
import { useMediaDates } from '@/hooks/use-media-dates';
import CurrentMonthBanner from './CurrentMonthBanner';
import { useGalleryContext } from '@/contexts/GalleryContext';
import { GalleryItem, MediaListResponse } from '@/types/gallery';
import { useGalleryLayout } from '@/hooks/use-gallery-layout';

interface VirtualizedGalleryGridProps {
  mediaResponse: MediaListResponse;
  selectedIds: string[];
  onSelectId: (id: string) => void;
  columnsCount: number;
  viewMode?: 'single' | 'split';
  position?: 'source' | 'destination';
  gap?: number;
  onSetNavigationFunctions?: (prevFn: () => boolean, nextFn: () => boolean) => void;
  gridRef?: React.RefObject<any>;
}

const VirtualizedGalleryGrid: React.FC<VirtualizedGalleryGridProps> = ({
  mediaResponse,
  selectedIds,
  onSelectId,
  columnsCount,
  viewMode = 'single',
  position = 'source',
  gap = 8,
  onSetNavigationFunctions,
  gridRef: externalGridRef
}) => {
  const innerGridRef = useRef<FixedSizeGrid>(null);
  const actualGridRef = externalGridRef || innerGridRef;
  const { isGalleryVisible } = useGalleryLayout();
  
  // Récupérer l'état de visibilité de la galerie
  const isVisible = isGalleryVisible(position === 'source' ? 'left' : 'right');
  
  // Récupérer les positions persistées depuis le contexte
  const { sourceYearMonth, destYearMonth, updateSourceYearMonth, updateDestYearMonth } = useGalleryContext();
  
  const persistedYearMonth = position === 'source' ? sourceYearMonth : destYearMonth;
  const updateYearMonth = position === 'source' ? updateSourceYearMonth : updateDestYearMonth;
  
  const {
    enrichedGalleryItems,
    currentYearMonthLabel,
    updateCurrentYearMonthFromScroll,
    navigateToPreviousMonth,
    navigateToNextMonth,
    setExternalGridRef
  } = useMediaDates(
    mediaResponse,
    columnsCount,
    position,
    persistedYearMonth,
    updateYearMonth,
    isVisible // Passer l'état de visibilité
  );
  
  // Référence à la grille externe si fournie
  React.useEffect(() => {
    if (externalGridRef) {
      setExternalGridRef(externalGridRef);
    }
  }, [externalGridRef, setExternalGridRef]);
  
  // Exposer les fonctions de navigation
  React.useEffect(() => {
    if (onSetNavigationFunctions) {
      const prevFn = () => navigateToPreviousMonth(actualGridRef);
      const nextFn = () => navigateToNextMonth(actualGridRef);
      onSetNavigationFunctions(prevFn, nextFn);
    }
  }, [onSetNavigationFunctions, navigateToPreviousMonth, navigateToNextMonth, actualGridRef]);
  
  const handleScroll = useCallback(({ scrollTop }) => {
    updateCurrentYearMonthFromScroll(scrollTop, actualGridRef);
  }, [updateCurrentYearMonthFromScroll, actualGridRef]);
  
  // Calculer le nombre de lignes
  const totalItems = enrichedGalleryItems.length;
  const rowCount = Math.ceil(totalItems / columnsCount);
  
  // Calculer les dimensions
  const cellWidth = 160; // Taille de base d'une cellule
  const estimatedRowHeight = 160; // Hauteur estimée d'une rangée
  
  // Fonction pour rendre une cellule
  const renderCell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnsCount + columnIndex;
    
    if (index >= totalItems) {
      return null;
    }
    
    const item = enrichedGalleryItems[index] as GalleryItem;
    
    return (
      <GalleryGridCell
        key={item.type === 'separator' ? `sep-${item.yearMonth}` : item.id}
        item={item}
        style={style}
        columnsCount={columnsCount}
        position={position}
        isSelected={item.type === 'media' && selectedIds.includes(item.id)}
        onSelect={onSelectId}
        viewMode={viewMode}
        gap={gap}
      />
    );
  }, [enrichedGalleryItems, columnsCount, selectedIds, onSelectId, position, viewMode, gap, totalItems]);
  
  // Rendu des éléments
  return (
    <div className="h-full relative">
      {/* Afficher le mois courant */}
      <CurrentMonthBanner
        currentMonthLabel={currentYearMonthLabel}
        position={position}
      />
      
      {/* Grille virtualisée */}
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeGrid
            ref={actualGridRef}
            columnCount={columnsCount}
            columnWidth={width / columnsCount}
            height={height}
            rowCount={rowCount}
            rowHeight={estimatedRowHeight}
            width={width}
            onScroll={handleScroll}
            className="scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-transparent"
            style={{ overflowX: 'hidden' }}
          >
            {renderCell}
          </FixedSizeGrid>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualizedGalleryGrid;
