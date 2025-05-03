import React, { memo } from 'react';
import LazyMediaItem from '@/components/LazyMediaItem';
import MonthYearSeparator from './MonthYearSeparator';
import { GalleryItem } from '@/types/gallery';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { parseMediaId } from '@/utils/mediaId';

interface GalleryGridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: GalleryItem[];
    selectedIds: string[];
    onSelectId: (id: string, extendSelection: boolean) => void;
    showDates?: boolean;
    position: 'source' | 'destination';
    columnsCount: number;
    gap: number;
    calculateCellStyle: (style: React.CSSProperties, columnIndex: number, isSeparator: boolean) => React.CSSProperties;
    recentlyDeletedIds: string[];
  };
}

/**
 * A cell component for the virtualized grid that renders a media item or separator
 * With improved positioning calculations
 */
const GalleryGridCell = memo(({ columnIndex, rowIndex, style, data }: GalleryGridCellProps) => {
  // Calculate the index in the flat array based on row and column
  const index = rowIndex * data.columnsCount + columnIndex;
  const isSmallScreen = !useBreakpoint('sm');
  
  // Return null for out of bounds indices to avoid errors
  if (index >= data.items.length) return null;
  
  // Get the item at this position
  const item = data.items[index];
  
  // For separator type, we only render it if it's at the beginning of a row (columnIndex === 0)
  if (item.type === 'separator') {
    // Only render separators at the beginning of rows (columnIndex === 0)
    if (columnIndex === 0) {
      // Calculate the style for this separator - make it span the entire row
      const separatorStyle = data.calculateCellStyle(style, columnIndex, true);
      
      // Extraire les dimensions de la cellule pour les passer au séparateur
      const cellWidth = parseFloat(separatorStyle.width as string);
      const cellHeight = parseFloat(separatorStyle.height as string);
      
      return (
        <div style={separatorStyle} className="separator-cell relative" role="cell" aria-label={`Separator: ${item.label}`}>
          <MonthYearSeparator 
            label={item.label} 
            cellWidth={cellWidth}
            cellHeight={cellHeight}
          />
        </div>
      );
    }
    // Skip rendering separators if they're not at the beginning of a row
    return null;
  }
  
  // Pour empty cells, render a minimal placeholder without any content or API calls
  if (item.id.startsWith('empty-')) {
    const emptyStyle = data.calculateCellStyle(style, columnIndex, false);
    return <div style={emptyStyle} className="empty-cell" aria-hidden="true" />;
  }

  // Pour les éléments manquants, afficher une case avec une croix rouge
  if (item.type === 'missing') {
    const missingStyle = data.calculateCellStyle(style, columnIndex, false);
    return (
      <div 
        style={missingStyle} 
        className="missing-cell relative bg-transparent flex items-center justify-center"
        role="cell"
        aria-label={`Missing item: ${item.id}`}
      >
        <img
          src="/not_copied_duplicate_64x64.png"
          alt="Missing item"
          className="w-10 h-10 object-contain opacity-80"
        />
      </div>
    );
  }
  
  // For media type, render the media item
  const id = item.id;
  const isSelected = data.selectedIds.includes(id);
  const { isDeleted } = parseMediaId(id);
  const isRecentlyDeleted = data.recentlyDeletedIds.includes(id);
  
  // Calculate the cell style with proper gap adjustments
  const adjustedStyle = data.calculateCellStyle(style, columnIndex, false);
  
  return (
    <div style={adjustedStyle} className="relative">
      <LazyMediaItem
        key={id}
        id={id}
        selected={isSelected}
        onSelect={data.onSelectId}
        index={item.index}
        showDates={data.showDates}
        position={data.position}
      />
      {(isDeleted || isRecentlyDeleted) && (
        <div className="absolute top-1 right-1 z-10 bg-white/80 rounded-full p-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-rose-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  );
});

// Set display name for debugging
GalleryGridCell.displayName = 'GalleryGridCell';

export default GalleryGridCell;
