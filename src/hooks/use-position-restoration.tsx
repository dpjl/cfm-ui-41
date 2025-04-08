
import { useRef, useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { useGridRenderDetection } from './use-grid-render-detection';
import { useGridDimensionChange } from './use-grid-dimension-change';
import type { FixedSizeGrid } from 'react-window';

// Configuration des délais pour différentes opérations
const RESTORATION_DELAYS = {
  UNLOCK_UPDATES: 300  // Attente avant de réactiver les mises à jour
};

type PositionRestorationSource = 'grid-render' | 'initial' | 'manual' | 'dimension-change' | 'visibility-change';

interface UsePositionRestorationProps {
  gridRef: React.RefObject<FixedSizeGrid> | null;
  currentYearMonth: string | null;
  onScrollToYearMonth: (year: number, month: number, gridRef: React.RefObject<any>) => boolean;
  persistedYearMonth?: string | null;
  onUpdateYearMonth?: (yearMonth: string | null, immediate?: boolean) => void;
  position?: 'source' | 'destination';
  columnsCount?: number;
  isVisible?: boolean; // Nouveau paramètre pour la visibilité
}

/**
 * Hook centralisé pour gérer la restauration de position dans les grilles.
 * Utilise useLayoutEffect pour restaurer la position de manière synchrone
 * lors du rendu ou re-rendu de la grille.
 */
export function usePositionRestoration({
  gridRef,
  currentYearMonth,
  onScrollToYearMonth,
  persistedYearMonth,
  onUpdateYearMonth,
  position = 'source',
  columnsCount,
  isVisible = true // Par défaut considéré comme visible
}: UsePositionRestorationProps) {
  // État indiquant qu'une restauration est en cours
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Référence pour stocker la dernière position connue
  const lastYearMonthRef = useRef<string | null>(null);
  
  // Référence pour indiquer si l'initialisation a déjà eu lieu
  const hasInitializedRef = useRef<boolean>(false);
  
  // Référence pour suivre l'état de visibilité précédent
  const wasVisibleRef = useRef<boolean>(isVisible);
  
  // Fonction centrale pour restaurer la position
  const restorePosition = useCallback((
    source: PositionRestorationSource,
    yearMonthToRestore: string | null = null
  ) => {
    // Vérifier si la référence de la grille est valide
    if (!gridRef) return false;
    
    // Vérifier si la grille est visible (sauf pour les restaurations manuelles)
    if (source !== 'manual' && !isVisible) {
      console.log(`[${position}] Skipping restoration due to invisibility`);
      return false;
    }
    
    // MODIFICATION: Prioriser yearMonthToRestore, puis currentYearMonth, puis lastYearMonthRef.current
    // Cela garantit que nous utilisons toujours la position la plus récente connue
    const targetYearMonth = yearMonthToRestore || currentYearMonth || lastYearMonthRef.current;
    
    if (!targetYearMonth) return false;
    
    console.log(`[${position}] Initiating position restoration due to: ${source}`);
    
    // Activer l'état de restauration
    setIsRestoring(true);
    
    // Stocker la position actuelle
    lastYearMonthRef.current = targetYearMonth;
    
    // Effectuer la restauration immédiatement (synchrone avec useLayoutEffect)
    if (targetYearMonth && gridRef) {
      const [year, month] = targetYearMonth.split('-').map(Number);
      
      if (!isNaN(year) && !isNaN(month)) {
        console.log(`[${position}] Restoring to ${year}-${month} after ${source}`);
        
        // Utiliser la fonction de défilement fournie
        onScrollToYearMonth(year, month, gridRef);
        
        // Signaler la mise à jour du mois courant au parent si nécessaire
        if (onUpdateYearMonth) {
          // Mise à jour immédiate pour les actions manuelles ou les changements de visibilité
          const immediate = source === 'manual' || source === 'visibility-change';
          onUpdateYearMonth(targetYearMonth, immediate);
        }
        
        // Réactiver les mises à jour après un délai
        setTimeout(() => {
          setIsRestoring(false);
          console.log(`[${position}] Restoration complete, updates re-enabled`);
        }, RESTORATION_DELAYS.UNLOCK_UPDATES);
      }
    }
    
    return true;
  }, [gridRef, currentYearMonth, onScrollToYearMonth, onUpdateYearMonth, position, isVisible]);
  
  // Utiliser le hook de détection de rendu pour restaurer la position
  useGridRenderDetection(gridRef, useCallback((gridRef, mountCount) => {
    // Ne pas restaurer lors du tout premier rendu si nous avons une valeur persistée
    // (elle sera gérée par l'effet d'initialisation)
    if (isVisible && (mountCount > 1 || !persistedYearMonth)) {
      restorePosition('grid-render');
    }
  }, [restorePosition, persistedYearMonth, isVisible]));
  
  // Utiliser le hook de détection de changement de dimensions
  useGridDimensionChange(
    gridRef,
    useCallback((currentDimensions, prevDimensions, gridRef) => {
      if (isVisible) {
        console.log(`[${position}] Grid dimensions changed, restoring position`);
        restorePosition('dimension-change');
      }
    }, [position, isVisible, restorePosition]),
    [isVisible] // dépendances additionnelles
  );
  
  // Initialisation avec la position persistée
  useLayoutEffect(() => {
    // Vérifier si gridRef existe avant d'accéder à sa propriété current
    if (isVisible && persistedYearMonth && !hasInitializedRef.current && gridRef) {
      hasInitializedRef.current = true;
      console.log(`[${position}] Initializing with persisted position: ${persistedYearMonth}`);
      restorePosition('initial', persistedYearMonth);
    }
  }, [persistedYearMonth, gridRef, position, restorePosition, isVisible]);
  
  // NOUVEAU: effet pour gérer les changements de visibilité
  useEffect(() => {
    // Si la galerie devient visible alors qu'elle ne l'était pas avant
    if (isVisible && !wasVisibleRef.current) {
      console.log(`[${position}] Visibility changed to visible, triggering restoration`);
      // Une légère attente pour s'assurer que le composant est complètement monté
      const timeoutId = setTimeout(() => {
        restorePosition('visibility-change');
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
    
    // Mettre à jour la référence de visibilité
    wasVisibleRef.current = isVisible;
  }, [isVisible, position, restorePosition]);
  
  // Fonction pour forcer une restauration manuelle à une position spécifique
  const restoreToPosition = useCallback((yearMonth: string) => {
    return restorePosition('manual', yearMonth);
  }, [restorePosition]);

  return {
    isRestoring,
    restoreToPosition,
    lastPosition: lastYearMonthRef.current
  };
}
