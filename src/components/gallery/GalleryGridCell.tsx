
import React, { memo } from 'react';
import LazyMediaItem from '@/components/LazyMediaItem';
import MonthYearSeparator from './MonthYearSeparator';
import { GalleryItem } from '@/types/gallery';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useViewportHeight } from '@/hooks/use-viewport-height';

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
  const { bottomSafeArea } = useViewportHeight();
  
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
      
      // On small screens, adjust the height for better readability
      const finalStyle = isSmallScreen 
        ? { ...separatorStyle, height: `${parseFloat(separatorStyle.height as string) * 0.9}px` }
        : separatorStyle;
      
      return (
        <div style={finalStyle} className="separator-cell relative" role="cell" aria-label={`Separator: ${item.label}`}>
          <MonthYearSeparator label={item.label} />
        </div>
      );
    }
    // Skip rendering separators if they're not at the beginning of a row
    return null;
  }
  
  // For empty cells, render a minimal placeholder without any content or API calls
  if (item.id.startsWith('empty-')) {
    const emptyStyle = data.calculateCellStyle(style, columnIndex, false);
    return <div style={emptyStyle} className="empty-cell" aria-hidden="true" />;
  }
  
  // For media type, render the media item
  const id = item.id;
  const isSelected = data.selectedIds.includes(id);
  
  // Calculate the cell style with proper gap adjustments
  const adjustedStyle = data.calculateCellStyle(style, columnIndex, false);
  
  // Sur les dernières rangées, on doit prendre en compte la safe area sur mobile
  const isLastRowsOnMobile = isSmallScreen && 
    bottomSafeArea > 0 && 
    rowIndex >= (data.items.length / data.columnsCount) - 2;
  
  // Style final avec ajustement pour les dernières rangées sur mobile si nécessaire
  const finalStyle = isLastRowsOnMobile 
    ? { ...adjustedStyle, marginBottom: `${bottomSafeArea}px` }
    : adjustedStyle;
  
  return (
    <div style={finalStyle}>
      <LazyMediaItem
        key={id}
        id={id}
        selected={isSelected}
        onSelect={data.onSelectId}
        index={item.index}
        showDates={data.showDates}
        position={data.position}
      />
    </div>
  );
});

// Set display name for debugging
GalleryGridCell.displayName = 'GalleryGridCell';

export default GalleryGridCell;
