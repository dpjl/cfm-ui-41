import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { fetchMediaIds } from '@/api/imageApi';
import { GalleryViewMode, ViewModeType } from '@/types/gallery';
import { MediaFilter } from '@/components/AppSidebar';
import GalleryContent from '@/components/gallery/GalleryContent';
import DeleteConfirmationDialog from '@/components/gallery/DeleteConfirmationDialog';
import GalleriesView from './GalleriesView';
import MobileViewSwitcher from './MobileViewSwitcher';
import { ScrollSyncProvider } from '@/contexts/ScrollSyncContext';

interface BaseGalleryProps {
  columnsCountLeft: number;
  columnsCountRight: number;
  selectedDirectoryIdLeft: string;
  selectedDirectoryIdRight: string;
  selectedIdsLeft: string[];
  setSelectedIdsLeft: React.Dispatch<React.SetStateAction<string[]>>;
  selectedIdsRight: string[];
  setSelectedIdsRight: React.Dispatch<React.SetStateAction<string[]>>;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeSide: 'left' | 'right';
  deleteMutation: any;
  handleDeleteSelected: (side: 'left' | 'right') => void;
  handleDelete: () => void;
  leftFilter?: MediaFilter;
  rightFilter?: MediaFilter;
  pathRegexLeft?: string;
  pathRegexRight?: string;
}

interface SidebarToggleProps {
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

interface GalleriesContainerProps extends BaseGalleryProps, SidebarToggleProps {
  mobileViewMode: GalleryViewMode;
  setMobileViewMode: React.Dispatch<React.SetStateAction<GalleryViewMode>>;
  onColumnsChange?: (side: 'left' | 'right', count: number) => void;
}

const GalleriesContainer: React.FC<GalleriesContainerProps> = ({
  columnsCountLeft,
  columnsCountRight,
  selectedIdsLeft,
  setSelectedIdsLeft,
  selectedIdsRight,
  setSelectedIdsRight,
  selectedDirectoryIdLeft,
  selectedDirectoryIdRight,
  deleteDialogOpen,
  setDeleteDialogOpen,
  activeSide,
  deleteMutation,
  handleDeleteSelected,
  handleDelete,
  mobileViewMode,
  setMobileViewMode,
  leftFilter,
  rightFilter,
  pathRegexLeft = '',
  pathRegexRight = '',
  onToggleLeftPanel,
  onToggleRightPanel,
  onColumnsChange
}) => {
  const isMobile = useIsMobile();
  const [syncMode, setSyncMode] = useState(false);
  const [recentlyDeletedIds, setRecentlyDeletedIds] = useState<string[]>([]);
  const [galleryToDelete, setGalleryToDelete] = useState<'left' | 'right'>('left');

  // Calcul du nombre de colonnes synchronisé
  const syncColumnsCount = Math.min(columnsCountLeft, columnsCountRight);

  // Fetch left gallery media (nouveau format)
  const { data: leftMediaByDate = {}, isLoading: isLoadingLeftMediaIds, error: errorLeftMediaIds } = useQuery({
    queryKey: ['leftMediaByDate', selectedDirectoryIdLeft, leftFilter, pathRegexLeft],
    queryFn: () => fetchMediaIds(selectedDirectoryIdLeft, 'source', leftFilter as string, pathRegexLeft)
  });

  // Fetch right gallery media (nouveau format)
  const { data: rightMediaByDate = {}, isLoading: isLoadingRightMediaIds, error: errorRightMediaIds } = useQuery({
    queryKey: ['rightMediaByDate', selectedDirectoryIdRight, rightFilter, pathRegexRight],
    queryFn: () => fetchMediaIds(selectedDirectoryIdRight, 'destination', rightFilter as string, pathRegexRight)
  });

  // Handler functions
  const handleSelectIdLeft = (id: string) => setSelectedIdsLeft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  const handleSelectIdRight = (id: string) => setSelectedIdsRight((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  const handlePreviewItemLeft = (id: string) => console.log(`Previewing item ${id} in source`);
  const handlePreviewItemRight = (id: string) => console.log(`Previewing item ${id} in destination`);
  
  // Handler pour la suppression
  const handleDeleteConfirmed = useCallback(() => {
    // Mettre à jour les IDs supprimés avant la suppression
    if (galleryToDelete === 'left' && selectedIdsLeft.length > 0) {
      setRecentlyDeletedIds(prev => [...prev, ...selectedIdsLeft]);
    } else if (galleryToDelete === 'right' && selectedIdsRight.length > 0) {
      setRecentlyDeletedIds(prev => [...prev, ...selectedIdsRight]);
    }
    
    // Appeler la fonction de suppression originale
    handleDelete();
  }, [galleryToDelete, selectedIdsLeft, selectedIdsRight, handleDelete]);

  // Simplified handlers for deletion
  const handleDeleteLeft = () => {
    setGalleryToDelete('left');
    handleDeleteSelected('left');
  };
  
  const handleDeleteRight = () => {
    setGalleryToDelete('right');
    handleDeleteSelected('right');
  };

  // Column change handlers
  const handleLeftColumnsChange = (count: number) => {
    if (onColumnsChange) {
      console.log('Left columns changed to:', count);
      onColumnsChange('left', count);
    }
  };

  const handleRightColumnsChange = (count: number) => {
    if (onColumnsChange) {
      console.log('Right columns changed to:', count);
      onColumnsChange('right', count);
    }
  };

  // Toggle full view handlers
  const handleToggleLeftFullView = () => {
    if (mobileViewMode === 'left') {
      setMobileViewMode('both');
    } else {
      setMobileViewMode('left');
    }
  };

  const handleToggleRightFullView = () => {
    if (mobileViewMode === 'right') {
      setMobileViewMode('both');
    } else {
      setMobileViewMode('right');
    }
  };

  // Prepare content for left and right galleries
  const leftGalleryContent = (
    <GalleryContent
      title="Source"
      mediaByDate={leftMediaByDate}
      selectedIds={selectedIdsLeft}
      onSelectId={handleSelectIdLeft}
      isLoading={isLoadingLeftMediaIds}
      isError={!!errorLeftMediaIds}
      error={errorLeftMediaIds}
      columnsCount={syncMode ? syncColumnsCount : columnsCountLeft}
      viewMode={mobileViewMode === 'both' ? 'split' : 'single'}
      onPreviewItem={handlePreviewItemLeft}
      onDeleteSelected={handleDeleteLeft}
      position="source"
      filter={leftFilter}
      onToggleSidebar={onToggleLeftPanel}
      onColumnsChange={handleLeftColumnsChange}
      mobileViewMode={mobileViewMode}
      onToggleFullView={handleToggleLeftFullView}
      isSyncMode={syncMode}
      unionData={syncMode ? rightMediaByDate : undefined}
      recentlyDeletedIds={recentlyDeletedIds}
    />
  );

  const rightGalleryContent = (
    <GalleryContent
      title="Destination"
      mediaByDate={rightMediaByDate}
      selectedIds={selectedIdsRight}
      onSelectId={handleSelectIdRight}
      isLoading={isLoadingRightMediaIds}
      isError={!!errorRightMediaIds}
      error={errorRightMediaIds}
      columnsCount={syncMode ? syncColumnsCount : columnsCountRight}
      viewMode={mobileViewMode === 'both' ? 'split' : 'single'}
      onPreviewItem={handlePreviewItemRight}
      onDeleteSelected={handleDeleteRight}
      position="destination"
      filter={rightFilter}
      onToggleSidebar={onToggleRightPanel}
      onColumnsChange={handleRightColumnsChange}
      mobileViewMode={mobileViewMode}
      onToggleFullView={handleToggleRightFullView}
      isSyncMode={syncMode}
      unionData={syncMode ? leftMediaByDate : undefined}
      recentlyDeletedIds={recentlyDeletedIds}
    />
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <ScrollSyncProvider>
        <GalleriesView
          viewMode={mobileViewMode}
          leftContent={leftGalleryContent}
          rightContent={rightGalleryContent}
          syncMode={syncMode}
          onToggleSyncMode={() => setSyncMode(!syncMode)}
        />
      </ScrollSyncProvider>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        selectedIds={galleryToDelete === 'left' ? selectedIdsLeft : selectedIdsRight}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteDialogOpen(false)}
        isPending={deleteMutation.isPending}
        count={galleryToDelete === 'left' ? selectedIdsLeft.length : selectedIdsRight.length}
      />
    </div>
  );
};

export default GalleriesContainer;
