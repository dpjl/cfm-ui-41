import { useLayoutEffect, useRef } from 'react';
import type { FixedSizeGrid } from 'react-window';
import { MediaListResponse, MediaIdsByDate } from '@/types/gallery';

/**
 * Hook pour gérer le suivi des médias dans la galerie et leur affichage
 * Optimisé pour éviter les réinitialisations inutiles du défilement
 * Maintenant avec useLayoutEffect pour une meilleure synchronisation
 */
export function useGalleryMediaTracking(
  mediaByDate: MediaIdsByDate | undefined,
  gridRef: React.RefObject<FixedSizeGrid>,
  persistedYearMonth?: string | null
) {
  const prevMediaIdsRef = useRef<string[]>([]);
  const hasInitializedFromPersistedValueRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!mediaByDate || hasInitializedFromPersistedValueRef.current) return;
    // Concaténer tous les ids de toutes les dates
    const mediaIds = Object.values(mediaByDate).flat();
    const prevMediaIds = prevMediaIdsRef.current;
    if (persistedYearMonth) {
      hasInitializedFromPersistedValueRef.current = true;
      prevMediaIdsRef.current = [...mediaIds];
      return;
    }
    const significantMediaChange = Math.abs(mediaIds.length - prevMediaIds.length) > 20;
    if (significantMediaChange && gridRef.current) {
      prevMediaIdsRef.current = [...mediaIds];
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [mediaByDate, gridRef, persistedYearMonth]);
}
