
import React, { memo } from 'react';
import LazyMediaItem from '@/components/LazyMediaItem';
import MonthYearSeparator from './MonthYearSeparator';
import { GalleryItem } from '@/types/gallery';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface GalleryGridCellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    items: GalleryItem[];
    selectedIds: string[];
    onSelectId: (id: string, extendSelection: boolean) => void;
    showDates?: boolean;
    updateMediaInfo?: (id: string, info: any) => void;
    position: 'source' | 'destination';
    columnsCount: number;
    gap: number;
    calculateCellStyle: (style: React.CSSProperties, columnIndex: number, isSeparator: boolean) => React.CSSProperties;
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
  
  // For separator type, we need a more robust approach that doesn't depend on columnIndex === 0
  if (item.type === 'separator') {
    // Determine if this is the first occurrence of this separator in the current row
    // We check all items in the current row to see if any previous item has the same yearMonth
    const rowStartIndex = rowIndex * data.columnsCount;
    const rowEndIndex = Math.min(rowStartIndex + columnIndex, data.items.length - 1);
    
    let isFirstSeparatorOccurrence = true;
    // Check if the same separator appears earlier in this row
    for (let i = rowStartIndex; i < rowEndIndex; i++) {
      const prevItem = data.items[i];
      if (prevItem.type === 'separator' && prevItem.yearMonth === item.yearMonth) {
        isFirstSeparatorOccurrence = false;
        break;
      }
    }
    
    // Only render this separator if it's the first occurrence in this row
    if (isFirstSeparatorOccurrence) {
      // Calculer le style normal pour ce séparateur (une cellule standard)
      const separatorStyle = data.calculateCellStyle(style, columnIndex, false);
      
      // Sur les petits écrans, ajuster la taille pour une meilleure lisibilité
      const finalStyle = isSmallScreen 
        ? { ...separatorStyle, height: `${parseFloat(separatorStyle.height as string) * 0.9}px` }
        : separatorStyle;
      
      return (
        <div style={finalStyle} className="separator-cell relative" role="cell" aria-label={`Separator: ${item.label}`}>
          <MonthYearSeparator label={item.label} />
        </div>
      );
    }
    // Skip rendering duplicate separators in the same row
    return null;
  }
  
  // For media type, render the media item
  const id = item.id;
  const isSelected = data.selectedIds.includes(id);
  
  // Calculate the cell style with proper gap adjustments
  const adjustedStyle = data.calculateCellStyle(style, columnIndex, false);
  
  return (
    <div style={adjustedStyle}>
      <LazyMediaItem
        key={id}
        id={id}
        selected={isSelected}
        onSelect={data.onSelectId}
        index={item.index}
        showDates={data.showDates}
        updateMediaInfo={data.updateMediaInfo}
        position={data.position}
      />
    </div>
  );
});

// Set display name for debugging
GalleryGridCell.displayName = 'GalleryGridCell';

export default GalleryGridCell;
