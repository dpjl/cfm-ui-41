import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
import { MediaIdsByDate, GalleryViewMode } from '@/types/gallery';

type GalleryMonthNavigationProps = {
  currentMonthLabel: string;
  onMonthSelect: () => void;
};

interface GalleryProps {
  title: string;
  mediaByDate: MediaIdsByDate;
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
  isSyncMode?: boolean;
  unionData?: MediaIdsByDate;
  recentlyDeletedIds?: string[];
}

const Gallery: React.FC<GalleryProps> = ({
  title,
  mediaByDate,
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
  gridRef,
  isSyncMode,
  unionData,
  recentlyDeletedIds = []
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const { mediaInfoMap } = useLazyMediaInfo(position);

  const selection = useGallerySelection({
    mediaIds: [],
    selectedIds,
    onSelectId
  });

  const preview = useGalleryPreviewHandler({
    mediaIds: [],
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

  const gridRefLocal = useRef<any>(null);

  const [monthNavFns, setMonthNavFns] = useState({
    prev: undefined as undefined | (() => void),
    next: undefined as undefined | (() => void),
    select: undefined as undefined | (() => void),
  });

  const handleSetNavigationFunctionsLocal = useCallback((fns: { prev: () => void, next: () => void, select: () => void }) => {
    setMonthNavFns(fns);
  }, []);

  const [currentMonthLabel, setCurrentMonthLabel] = useState<string>("");

  const handleCurrentMonthChange = useCallback((label: string) => {
    setCurrentMonthLabel(label);
  }, []);

  const [dateIndex, setDateIndex] = useState<{ years: number[]; monthsByYear: Map<number, number[]> }>({ years: [], monthsByYear: new Map() });

  const shouldShowInfoPanel = selectedIds.length > 0;

  const handleCloseInfoPanel = useCallback(() => {
    selectedIds.forEach(id => onSelectId(id));
  }, [selectedIds, onSelectId]);

  const galleryGridRef = useRef<any>(null);

  const handleSelectYearMonth = useCallback((year: number, month: number) => {
    if (galleryGridRef.current && typeof galleryGridRef.current.scrollToYearMonth === 'function') {
      galleryGridRef.current.scrollToYearMonth(year, month);
    }
  }, []);

  const handleSelectId = useCallback((id: string, extendSelection?: boolean) => {
    selection.handleSelectItem(id, extendSelection);
  }, [selection]);

  // Calculer le nombre total d'éléments
  const totalItems = useMemo(() => {
    if (!mediaByDate) return 0;
    return Object.values(mediaByDate).reduce((acc, ids) => acc + ids.length, 0);
  }, [mediaByDate]);

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
        mediaIds={Object.values(mediaByDate || {}).flat()}
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
        currentMonthLabel={currentMonthLabel}
        showMonthNavigation={false}
        years={dateIndex.years}
        monthsByYear={dateIndex.monthsByYear}
        onSelectYearMonth={handleSelectYearMonth}
      />

      <div className="flex-1 overflow-hidden relative scrollbar-hidden">
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

        {Object.keys(mediaByDate).length === 0 ? (
          <GalleryEmptyState />
        ) : (
          <VirtualizedGalleryGrid
            ref={galleryGridRef}
            mediaByDate={mediaByDate}
            selectedIds={selectedIds}
            onSelectId={handleSelectId}
            columnsCount={columnsCount}
            viewMode={viewMode}
            showDates={false}
            position={position}
            gap={gap}
            filter={filter}
            onPreviewMedia={onPreviewMedia}
            onDeleteSelected={onDeleteSelected}
            currentMonthLabel={currentMonthLabel}
            onCurrentMonthChange={handleCurrentMonthChange}
            onSetNavigationFunctions={handleSetNavigationFunctionsLocal}
            gridRef={gridRefLocal}
            onDateIndexChange={setDateIndex}
            isSyncMode={isSyncMode}
            unionData={unionData}
            recentlyDeletedIds={recentlyDeletedIds}
          />
        )}
        <div className="pointer-events-none">
          <div className="absolute bottom-6 left-0 w-full flex justify-center z-50 pointer-events-auto">
            <GalleryToolbar
              mediaIds={[]}
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
              onNavigateToPreviousMonth={monthNavFns?.prev}
              onNavigateToNextMonth={monthNavFns?.next}
              onMonthSelect={monthNavFns?.select}
              currentMonthLabel={currentMonthLabel}
              showMonthNavigation={true}
              years={dateIndex.years}
              monthsByYear={dateIndex.monthsByYear}
              onSelectYearMonth={handleSelectYearMonth}
            />
          </div>
        </div>
      </div>

      {preview.previewMediaId && (
        <MediaPreview 
          mediaId={preview.previewMediaId}
          isVideo={isVideoPreview(preview.previewMediaId)}
          onClose={preview.handleClosePreview}
          onNext={undefined}
          onPrevious={undefined}
          hasNext={false}
          hasPrevious={false}
          position={position}
        />
      )}
    </div>
  );
};

export default Gallery;
