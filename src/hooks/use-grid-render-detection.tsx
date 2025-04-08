
import { useRef, useLayoutEffect } from 'react';
import type { FixedSizeGrid } from 'react-window';

/**
 * Hook qui détecte le rendu ou re-rendu d'une grille et appelle un callback
 * Utilise useLayoutEffect pour garantir une exécution synchrone avant le repaint du navigateur
 */
export function useGridRenderDetection(
  gridRef: React.RefObject<FixedSizeGrid> | null,
  onGridRender: (gridRef: React.RefObject<FixedSizeGrid>, mountCount: number) => void
) {
  const mountCountRef = useRef<number>(0);
  const gridInstanceRef = useRef<any>(null);
  
  // Utiliser useLayoutEffect pour détecter les changements synchrones
  useLayoutEffect(() => {
    // Vérifier si la référence de la grille a changé ou si c'est le premier rendu
    if (gridRef?.current && gridRef.current !== gridInstanceRef.current) {
      // Sauvegarder la nouvelle instance de grille
      gridInstanceRef.current = gridRef.current;
      
      // Incrémenter le compteur de montage
      mountCountRef.current += 1;
      
      console.log(`Grid rerendered (mount #${mountCountRef.current})`);
      
      // Appeler le callback
      onGridRender(gridRef, mountCountRef.current);
    }
  }, [gridRef, onGridRender]);
  
  return {
    mountCount: mountCountRef.current,
    isFirstRender: mountCountRef.current === 1
  };
}
