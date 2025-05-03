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
export type MediaFilter = string; // Now more flexible to accept any filter ID from the backend

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
  pathRegex?: string;
  onPathRegexChange?: (value: string) => void;
  onValidatePathRegex?: () => void;
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
  onOpenDbViewer,
  pathRegex = '',
  onPathRegexChange = () => {},
  onValidatePathRegex = () => {},
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

        {/* Path Regex Filter */}
        <div className="mt-3">
          <label htmlFor="path-regex" className="block text-xs font-medium text-muted-foreground mb-1">
            Path Regex
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="path-regex"
              type="text"
              className="w-full px-2 py-1 border border-muted rounded bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition placeholder:text-muted-foreground"
              placeholder="e.g. 2024-06.* or IMG.*jpg"
              value={pathRegex}
              onChange={e => onPathRegexChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onValidatePathRegex(); }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="px-2 py-1 text-xs rounded font-medium bg-primary text-primary-foreground shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-colors duration-150"
              onClick={onValidatePathRegex}
              title="Valider le filtre regex"
            >
              Valider
            </button>
          </div>
        </div>
        
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
