
import { useEffect, useRef } from 'react';
import type { FixedSizeGrid } from 'react-window';
import { MediaListResponse } from '@/types/gallery';

/**
 * Hook pour gérer le suivi des médias dans la galerie et leur affichage
 * Optimisé pour éviter les réinitialisations inutiles du défilement
 */
export function useGalleryMediaTracking(
  mediaResponse: MediaListResponse | undefined, 
  gridRef: React.RefObject<FixedSizeGrid>
) {
  const prevMediaIdsRef = useRef<string[]>([]);
  
  // Debug log helper
  const debugLog = (message: string, data?: any) => {
    if (data) {
      console.log(`[useGalleryMediaTracking] ${message}`, data);
    } else {
      console.log(`[useGalleryMediaTracking] ${message}`);
    }
  };
  
  // Détecter uniquement les changements importants dans les médias
  useEffect(() => {
    if (!mediaResponse) return;
    
    const mediaIds = mediaResponse.mediaIds;
    const prevMediaIds = prevMediaIdsRef.current;
    
    // Vérifier s'il y a eu un changement significatif dans les médias
    const significantMediaChange = Math.abs(mediaIds.length - prevMediaIds.length) > 20;
    
    debugLog(`Media check: current=${mediaIds.length}, previous=${prevMediaIds.length}, significant change=${significantMediaChange}`);
    
    if (significantMediaChange && gridRef.current) {
      // Stocker la liste actuelle comme référence
      prevMediaIdsRef.current = [...mediaIds];
      
      debugLog('Significant media change detected, scrolling to top');
      
      // Faire remonter la grille vers le haut
      gridRef.current.scrollTo({ scrollTop: 0 });
    }
  }, [mediaResponse, gridRef]);
}
