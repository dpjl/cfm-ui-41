
import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { GalleryViewMode } from '@/types/gallery';
import FilterOptions from '@/components/sidebar/FilterOptions';
import FolderTreeSection from '@/components/sidebar/FolderTreeSection';
import ColumnSliders from '@/components/sidebar/ColumnSliders';

// Define our filter types
export type MediaFilter = 'all' | 'unique' | 'duplicates' | 'exclusive' | 'common';

interface AppSidebarProps {
  selectedDirectoryId: string;
  onSelectDirectory: (directoryId: string) => void;
  position?: 'left' | 'right';
  selectedFilter?: MediaFilter;
  onFilterChange?: (filter: MediaFilter) => void;
  mobileViewMode?: GalleryViewMode;
  onColumnsChange?: (count: number) => void;
  columnValues: {
    [key: string]: number;
  };
  currentViewMode?: string;
  onOpenDbViewer?: (directoryId: string, position: 'source' | 'destination') => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ 
  selectedDirectoryId, 
  onSelectDirectory,
  position = 'left',
  selectedFilter = 'all',
  onFilterChange = () => {},
  mobileViewMode = 'both',
  onColumnsChange,
  columnValues,
  currentViewMode,
  onOpenDbViewer
}) => {
  const { t } = useLanguage();

  // Pour forcer un re-rendu quand les valeurs changent 
  const sliderKey = React.useMemo(() => 
    Object.values(columnValues).join('-'), [columnValues]);

  const handleOpenDbViewer = () => {
    if (onOpenDbViewer && selectedDirectoryId) {
      onOpenDbViewer(
        selectedDirectoryId, 
        position === 'left' ? 'source' : 'destination'
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/90 backdrop-blur-sm w-full overflow-hidden">
      {/* Filters and Column Sliders section */}
      <div className="p-3 border-b">
        {/* Filter Options */}
        <FilterOptions
          selectedFilter={selectedFilter}
          onFilterChange={onFilterChange}
        />
        
        {/* Column count sliders */}
        <div className="mt-3">
          <ColumnSliders
            key={sliderKey}
            position={position}
            columnValues={columnValues}
            mobileViewMode={mobileViewMode}
            currentViewMode={currentViewMode}
            onColumnsChange={onColumnsChange}
          />
        </div>
        
        {/* Database Viewer Button */}
        {onOpenDbViewer && selectedDirectoryId && (
          <div className="mt-3">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleOpenDbViewer}
            >
              <Database className="h-4 w-4" />
              <span>Voir les données</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Folder tree section */}
      <FolderTreeSection
        selectedDirectoryId={selectedDirectoryId}
        onSelectDirectory={onSelectDirectory}
        position={position}
      />
    </div>
  );
};

export default AppSidebar;
