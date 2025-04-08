
import { useLayoutEffect, useRef } from 'react';
import type { FixedSizeGrid } from 'react-window';
import { MediaListResponse } from '@/types/gallery';

/**
 * Hook pour gérer le suivi des médias dans la galerie et leur affichage
 * Optimisé pour éviter les réinitialisations inutiles du défilement
 * Maintenant avec useLayoutEffect pour une meilleure synchronisation
 */
export function useGalleryMediaTracking(
  mediaResponse: MediaListResponse | undefined, 
  gridRef: React.RefObject<FixedSizeGrid>,
  persistedYearMonth?: string | null
) {
  const prevMediaIdsRef = useRef<string[]>([]);
  const hasInitializedFromPersistedValueRef = useRef<boolean>(false);
  
  // Détecter uniquement les changements importants dans les médias
  useLayoutEffect(() => {
    if (!mediaResponse || hasInitializedFromPersistedValueRef.current) return;
    
    const mediaIds = mediaResponse.mediaIds;
    const prevMediaIds = prevMediaIdsRef.current;
    
    // Si nous avons une année-mois persistée, on ne remonte pas automatiquement vers le haut
    if (persistedYearMonth) {
      // Simplement marquer que nous avons déjà une valeur persistée
      hasInitializedFromPersistedValueRef.current = true;
      // Mettre à jour la référence pour les comparaisons futures
      prevMediaIdsRef.current = [...mediaIds];
      return;
    }
    
    // Vérifier s'il y a eu un changement significatif dans les médias
    const significantMediaChange = Math.abs(mediaIds.length - prevMediaIds.length) > 20;
    
    if (significantMediaChange && gridRef.current) {
      // Stocker la liste actuelle comme référence
      prevMediaIdsRef.current = [...mediaIds];
      
      // Faire remonter la grille vers le haut
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [mediaResponse, gridRef, persistedYearMonth]);
}
