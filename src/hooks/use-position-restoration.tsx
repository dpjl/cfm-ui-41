
import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { useGridRenderDetection } from './use-grid-render-detection';
import { useGridDimensionChange } from './use-grid-dimension-change';
import type { FixedSizeGrid } from 'react-window';

// Suppression de la constante RESTORATION_DELAYS car elle n'est plus nécessaire

type PositionRestorationSource = 'grid-render' | 'initial' | 'manual' | 'dimension-change';

interface UsePositionRestorationProps {
  gridRef: React.RefObject<FixedSizeGrid> | null;
  currentYearMonth: string | null;
  onScrollToYearMonth: (year: number, month: number, gridRef: React.RefObject<any>) => boolean;
  persistedYearMonth?: string | null;
  onUpdateYearMonth?: (yearMonth: string | null, immediate?: boolean) => void;
  position?: 'source' | 'destination';
  columnsCount?: number;
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
  columnsCount
}: UsePositionRestorationProps) {
  // Suppression de l'état isRestoring
  
  // Référence pour stocker la dernière position connue
  const lastYearMonthRef = useRef<string | null>(null);
  
  // Référence pour indiquer si l'initialisation a déjà eu lieu
  const hasInitializedRef = useRef<boolean>(false);
  
  // Fonction centrale pour restaurer la position
  const restorePosition = useCallback((
    source: PositionRestorationSource,
    yearMonthToRestore: string | null = null
  ) => {
    // Vérifier uniquement si la référence de la grille est valide
    if (!gridRef) return false;
    
    // Prioriser yearMonthToRestore, puis currentYearMonth, puis lastYearMonthRef.current
    const targetYearMonth = yearMonthToRestore || currentYearMonth || lastYearMonthRef.current;
    
    if (!targetYearMonth) return false;
    
    console.log(`[${position}] Initiating position restoration due to: ${source}`);
    
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
          // Mise à jour immédiate pour les actions manuelles
          const immediate = source === 'manual';
          onUpdateYearMonth(targetYearMonth, immediate);
        }
        
        console.log(`[${position}] Restoration complete`);
        // Suppression du setTimeout qui réactivait les mises à jour
      }
    }
    
    return true;
  }, [gridRef, currentYearMonth, onScrollToYearMonth, onUpdateYearMonth, position]);
  
  // Utiliser le hook de détection de rendu pour restaurer la position
  useGridRenderDetection(gridRef, useCallback((gridRef, mountCount) => {
    // Ne pas restaurer lors du tout premier rendu si nous avons une valeur persistée
    // (elle sera gérée par l'effet d'initialisation)
    if (mountCount > 1 || !persistedYearMonth) {
      restorePosition('grid-render');
    }
  }, [restorePosition, persistedYearMonth]));
  
  // Utiliser le hook de détection de changement de dimensions
  useGridDimensionChange(
    gridRef,
    useCallback((currentDimensions, prevDimensions, gridRef) => {
      // Suppression de la vérification !isRestoring
      console.log(`[${position}] Grid dimensions changed, restoring position`);
      restorePosition('dimension-change');
    }, [position, restorePosition]),
    [] // Suppression de isRestoring des dépendances
  );
  
  // Initialisation avec la position persistée
  useLayoutEffect(() => {
    // Vérifier si gridRef existe avant d'accéder à sa propriété current
    if (persistedYearMonth && !hasInitializedRef.current && gridRef) {
      hasInitializedRef.current = true;
      console.log(`[${position}] Initializing with persisted position: ${persistedYearMonth}`);
      restorePosition('initial', persistedYearMonth);
    }
  }, [persistedYearMonth, gridRef, position, restorePosition]);
  
  // Fonction pour forcer une restauration manuelle à une position spécifique
  const restoreToPosition = useCallback((yearMonth: string) => {
    return restorePosition('manual', yearMonth);
  }, [restorePosition]);

  return {
    // Suppression de isRestoring de l'objet retourné
    restoreToPosition,
    lastPosition: lastYearMonthRef.current
  };
}
