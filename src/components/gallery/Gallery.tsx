import React, { useState, useCallback, useRef } from 'react';
import { useLanguage } from '@/hooks/use-language';
import VirtualizedGalleryGrid from './VirtualizedGalleryGrid';
import GalleryEmptyState from './GalleryEmptyState';
import GallerySkeletons from './GallerySkeletons';
import MediaPreview from '../MediaPreview';
import { useLazyMediaInfo } from '@/hooks/use-lazy-media-info';
import { useGallerySelection } from '@/hooks/use-gallery-selection';
import { useGalleryPreviewHandler } from '@/hooks/use-gallery-preview-handler';
import GalleryToolbar from './GalleryToolbar';
import { useGalleryMediaHandler } from '@/hooks/use-gallery-media-handler';
import MediaInfoPanel from '../media/MediaInfoPanel';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { MediaItem, GalleryViewMode, MediaListResponse } from '@/types/gallery';

interface GalleryProps {
  title: string;
  mediaResponse: MediaListResponse;
  selectedIds: string[];
  onSelectId: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  columnsCount: number;
  onPreviewMedia?: (id: string) => void;
  viewMode?: 'single' | 'split';
  onDeleteSelected: () => void;
  position?: 'source' | 'destination';
  filter?: string;
  onToggleSidebar?: () => void;
  gap?: number;
  mobileViewMode?: GalleryViewMode;
  onToggleFullView?: () => void;
  gridRef?: React.RefObject<any>;
}

const Gallery: React.FC<GalleryProps> = ({
  title,
  mediaResponse,
  selectedIds,
  onSelectId,
  isLoading = false,
  isError = false,
  error,
  columnsCount,
  onPreviewMedia,
  viewMode = 'single',
  onDeleteSelected,
  position = 'source',
  filter = 'all',
  onToggleSidebar,
  gap = 8,
  mobileViewMode,
  onToggleFullView,
  gridRef
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaIds = mediaResponse?.mediaIds || [];
  
  const { mediaInfoMap } = useLazyMediaInfo(position);
  
  const selection = useGallerySelection({
    mediaIds,
    selectedIds,
    onSelectId
  });
  
  const preview = useGalleryPreviewHandler({
    mediaIds,
    onPreviewMedia
  });
  
  const mediaHandler = useGalleryMediaHandler(
    selectedIds,
    position
  );

  const navigateToPreviousMonthRef = useRef<() => boolean>(() => false);
  const navigateToNextMonthRef = useRef<() => boolean>(() => false);
  
  const handleNavigatePrevMonth = useCallback(() => {
    if (navigateToPreviousMonthRef.current) {
      return navigateToPreviousMonthRef.current();
    }
    return false;
  }, []);
  
  const handleNavigateNextMonth = useCallback(() => {
    if (navigateToNextMonthRef.current) {
      return navigateToNextMonthRef.current();
    }
    return false;
  }, []);
  
  const handleSetNavigationFunctions = useCallback((
    prevFn: () => boolean, 
    nextFn: () => boolean
  ) => {
    navigateToPreviousMonthRef.current = prevFn;
    navigateToNextMonthRef.current = nextFn;
  }, []);

  const shouldShowInfoPanel = selectedIds.length > 0;
  
  const handleCloseInfoPanel = useCallback(() => {
    selectedIds.forEach(id => onSelectId(id));
  }, [selectedIds, onSelectId]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="mt-2">
          <GallerySkeletons columnsCount={columnsCount} />
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex flex-col h-full p-4">
        <div className="text-destructive">Error loading gallery: {String(error)}</div>
      </div>
    );
  }

  const isVideoPreview = (id: string): boolean => {
    const info = mediaInfoMap.get(id);
    if (info) {
      const fileName = info.alt?.toLowerCase() || '';
      return fileName.endsWith('.mp4') || fileName.endsWith('.mov');
    }
    return id.startsWith('v');
  };
  
  return (
    <div className="flex flex-col h-full relative" ref={containerRef}>
      <GalleryToolbar
        mediaIds={mediaIds}
        selectedIds={selectedIds}
        onSelectAll={selection.handleSelectAll}
        onDeselectAll={selection.handleDeselectAll}
        viewMode={viewMode}
        position={position}
        onToggleSidebar={onToggleSidebar}
        selectionMode={selection.selectionMode}
        onToggleSelectionMode={selection.toggleSelectionMode}
        mobileViewMode={mobileViewMode}
        onToggleFullView={onToggleFullView}
        onNavigateToPreviousMonth={handleNavigatePrevMonth}
        onNavigateToNextMonth={handleNavigateNextMonth}
      />
      
      <div className="flex-1 overflow-hidden relative scrollbar-vertical">
        {shouldShowInfoPanel && (
          <div className="absolute top-2 left-0 right-0 z-[200] flex justify-center pointer-events-none">
            <MediaInfoPanel
              selectedIds={selectedIds}
              onOpenPreview={preview.handleOpenPreview}
              onDeleteSelected={onDeleteSelected}
              onDownloadSelected={mediaHandler.handleDownloadSelected}
              mediaInfoMap={mediaInfoMap}
              selectionMode={selection.selectionMode}
              position={position}
              onClose={handleCloseInfoPanel}
            />
          </div>
        )}
        
        {mediaIds.length === 0 ? (
          <GalleryEmptyState />
        ) : (
          <VirtualizedGalleryGrid
            mediaResponse={mediaResponse}
            selectedIds={selectedIds}
            onSelectId={selection.handleSelectItem}
            columnsCount={columnsCount}
            viewMode={viewMode}
            position={position}
            gap={gap}
            onSetNavigationFunctions={handleSetNavigationFunctions}
            gridRef={gridRef}
          />
        )}
      </div>
      
      {preview.previewMediaId && (
        <MediaPreview 
          mediaId={preview.previewMediaId}
          isVideo={isVideoPreview(preview.previewMediaId)}
          onClose={preview.handleClosePreview}
          onNext={mediaIds.length > 1 ? () => preview.handleNavigatePreview('next') : undefined}
          onPrevious={mediaIds.length > 1 ? () => preview.handleNavigatePreview('prev') : undefined}
          hasNext={mediaIds.length > 1}
          hasPrevious={mediaIds.length > 1}
          position={position}
        />
      )}
    </div>
  );
};

export default Gallery;
