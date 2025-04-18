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
import { MediaItem, GalleryViewMode, MediaListResponse } from '@/types/gallery';

type GalleryMonthNavigationProps = {
  currentMonthLabel: string;
  onMonthSelect: () => void;
};

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

  // --- Ajout de la logique des boutons mois ---
  // Ces handlers répliquent l'ancienne logique des barres d'outil
  const gridRefLocal = useRef<any>(null);
  // Les hooks de navigation sont dans VirtualizedGalleryGrid, mais on peut les dupliquer ici
  // ou les passer via props/callbacks si besoin
  // Pour l'instant, on va forwarder les handlers via le ref et les props
  
  // On va utiliser un state local pour stocker les callbacks de navigation reçus du VirtualizedGalleryGrid
  const [monthNavFns, setMonthNavFns] = useState({
    prev: undefined as undefined | (() => void),
    next: undefined as undefined | (() => void),
    select: undefined as undefined | (() => void),
  });

  // Callback pour recevoir les fonctions de navigation depuis VirtualizedGalleryGrid
  const handleSetNavigationFunctionsLocal = useCallback((fns: { prev: () => void, next: () => void, select: () => void }) => {
    setMonthNavFns(fns);
  }, []);

  // État pour le mois courant affiché dans la toolbar
  const [currentMonthLabel, setCurrentMonthLabel] = useState<string>("");

  // Met à jour le mois courant affiché dès que la grille change de mois (scroll, navigation ou sélection)
  const handleCurrentMonthChange = useCallback((label: string) => {
    setCurrentMonthLabel(label);
  }, []);

  // --- Ajout : état pour synchroniser le dateIndex dynamique ---
  const [dateIndex, setDateIndex] = useState<{ years: number[]; monthsByYear: Map<number, number[]> }>({ years: [], monthsByYear: new Map() });

  const shouldShowInfoPanel = selectedIds.length > 0;

  const handleCloseInfoPanel = useCallback(() => {
    selectedIds.forEach(id => onSelectId(id));
  }, [selectedIds, onSelectId]);

  const galleryGridRef = useRef<any>(null);

  // Handler de sélection de mois/année qui scrolle vraiment la grille
  const handleSelectYearMonth = useCallback((year: number, month: number) => {
    if (galleryGridRef.current && typeof galleryGridRef.current.scrollToYearMonth === 'function') {
      galleryGridRef.current.scrollToYearMonth(year, month);
    }
  }, []);

  // --- NEW: Provide a handler compatible with (id, extendSelection) ---
  const handleSelectId = useCallback((id: string, extendSelection?: boolean) => {
    selection.handleSelectItem(id, extendSelection);
  }, [selection]);

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
      {/* Toolbar classique en haut (sans navigation temporelle) */}
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
        // PAS de navigation temporelle ici
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

        {mediaIds.length === 0 ? (
          <GalleryEmptyState />
        ) : (
          <VirtualizedGalleryGrid
            ref={galleryGridRef}
            mediaResponse={mediaResponse}
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
            // --- Ajout : synchronisation du dateIndex ---
            onDateIndexChange={setDateIndex}
          />
        )}
        {/* Affichage de la navigation temporelle SEULEMENT en bas, superposée à la galerie */}
        <div className="pointer-events-none">
          <div className="absolute bottom-6 left-0 w-full flex justify-center z-50 pointer-events-auto">
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
              onNavigateToPreviousMonth={monthNavFns?.prev}
              onNavigateToNextMonth={monthNavFns?.next}
              onMonthSelect={monthNavFns.select}
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
