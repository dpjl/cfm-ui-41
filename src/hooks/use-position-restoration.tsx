
import { useRef, useState, useCallback, useEffect } from 'react';
import { throttle } from 'lodash';
import type { FixedSizeGrid } from 'react-window';

// Configuration des délais pour différentes opérations
const RESTORATION_DELAYS = {
  GRID_REBUILD: 200,   // Attente pour la reconstruction de la grille
  UNLOCK_UPDATES: 300, // Attente avant de réactiver les mises à jour
  DEBOUNCE: 100        // Debounce pour les événements de redimensionnement
};

type PositionRestorationSource = 'column-change' | 'view-mode-change' | 'resize' | 'initial' | 'manual';

interface UsePositionRestorationProps {
  gridRef: React.RefObject<FixedSizeGrid> | null;
  currentYearMonth: string | null;
  onScrollToYearMonth: (year: number, month: number, gridRef: React.RefObject<any>) => boolean;
  persistedYearMonth?: string | null;
  onUpdateYearMonth?: (yearMonth: string | null, immediate?: boolean) => void;
  columnsCount?: number;
  position?: 'source' | 'destination';
  viewMode?: string;
}

/**
 * Hook centralisé pour gérer la restauration de position dans les grilles.
 * Unifie les différentes sources de changements qui nécessitent une restauration
 * (changement de colonnes, de vue, redimensionnement, etc.)
 */
export function usePositionRestoration({
  gridRef,
  currentYearMonth,
  onScrollToYearMonth,
  persistedYearMonth,
  onUpdateYearMonth,
  columnsCount = 0,
  position = 'source',
  viewMode = 'single'
}: UsePositionRestorationProps) {
  // État indiquant qu'une restauration est en cours
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Référence pour stocker la dernière position connue
  const lastYearMonthRef = useRef<string | null>(null);
  
  // Références pour détecter les changements
  const previousColumnsRef = useRef<number>(columnsCount);
  const previousViewModeRef = useRef<string>(viewMode);
  const previousSizeRef = useRef<{ width: number, height: number }>({ width: 0, height: 0 });
  
  // Référence pour indiquer si l'initialisation a déjà eu lieu
  const hasInitializedRef = useRef<boolean>(false);
  
  // Fonction centrale pour restaurer la position
  const restorePosition = useCallback((
    source: PositionRestorationSource,
    yearMonthToRestore: string | null = null
  ) => {
    // Vérifier si la référence de la grille est valide
    if (!gridRef) return false;
    
    // Utiliser la position fournie, ou la dernière connue, ou la position actuelle
    const targetYearMonth = yearMonthToRestore || lastYearMonthRef.current || currentYearMonth;
    
    if (!targetYearMonth) return false;
    
    console.log(`[${position}] Initiating position restoration due to: ${source}`);
    
    // Activer l'état de restauration
    setIsRestoring(true);
    
    // Stocker la position actuelle
    lastYearMonthRef.current = targetYearMonth;
    
    // Effectuer la restauration après un délai pour permettre la reconstruction de la grille
    setTimeout(() => {
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
          
          // Réactiver les mises à jour après un délai
          setTimeout(() => {
            setIsRestoring(false);
            console.log(`[${position}] Restoration complete, updates re-enabled`);
          }, RESTORATION_DELAYS.UNLOCK_UPDATES);
        }
      }
    }, RESTORATION_DELAYS.GRID_REBUILD);
    
    return true;
  }, [gridRef, currentYearMonth, onScrollToYearMonth, onUpdateYearMonth, position]);
  
  // Gestionnaire pour le changement de colonnes
  useEffect(() => {
    if (previousColumnsRef.current !== columnsCount && currentYearMonth) {
      console.log(`[${position}] Columns changed from ${previousColumnsRef.current} to ${columnsCount}`);
      previousColumnsRef.current = columnsCount;
      restorePosition('column-change', currentYearMonth);
    }
  }, [columnsCount, currentYearMonth, position, restorePosition]);
  
  // Gestionnaire pour le changement de mode d'affichage
  useEffect(() => {
    if (previousViewModeRef.current !== viewMode && currentYearMonth) {
      console.log(`[${position}] View mode changed from ${previousViewModeRef.current} to ${viewMode}`);
      previousViewModeRef.current = viewMode;
      restorePosition('view-mode-change', currentYearMonth);
    }
  }, [viewMode, currentYearMonth, position, restorePosition]);
  
  // Fonction pour gérer le redimensionnement de la fenêtre
  const handleResize = useCallback((width: number, height: number) => {
    const isSignificantChange = 
      Math.abs(previousSizeRef.current.width - width) > 5 || 
      Math.abs(previousSizeRef.current.height - height) > 5;
    
    if (isSignificantChange && currentYearMonth) {
      previousSizeRef.current = { width, height };
      restorePosition('resize', currentYearMonth);
    }
  }, [currentYearMonth, restorePosition]);
  
  // Fonction throttled pour le redimensionnement
  const throttledHandleResize = useCallback(
    throttle(handleResize, RESTORATION_DELAYS.DEBOUNCE),
    [handleResize]
  );
  
  // Initialisation avec la position persistée
  useEffect(() => {
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
    isRestoring,
    handleResize: throttledHandleResize,
    restoreToPosition,
    lastPosition: lastYearMonthRef.current
  };
}
