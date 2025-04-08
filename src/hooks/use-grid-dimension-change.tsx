
import { useRef, useLayoutEffect } from 'react';
import type { FixedSizeGrid } from 'react-window';

interface GridDimensions {
  width: number;
  height: number;
  columnsCount: number;
}

/**
 * Hook qui détecte les changements de dimensions d'une grille
 * et appelle un callback lorsque ces dimensions changent
 */
export function useGridDimensionChange(
  gridRef: React.RefObject<FixedSizeGrid> | null,
  onDimensionChange: (
    currentDimensions: GridDimensions, 
    previousDimensions: GridDimensions | null, 
    gridRef: React.RefObject<FixedSizeGrid>
  ) => void,
  dependencies: any[] = []
) {
  // Référence pour stocker les dimensions précédentes
  const prevDimensionsRef = useRef<GridDimensions | null>(null);
  
  // Utiliser useLayoutEffect pour garantir une exécution synchrone
  useLayoutEffect(() => {
    if (!gridRef?.current) return;
    
    const grid = gridRef.current;
    
    // Obtenir les dimensions actuelles
    const currentDimensions: GridDimensions = {
      width: grid.props.width,
      height: grid.props.height,
      columnsCount: grid.props.columnCount
    };
    
    const prevDimensions = prevDimensionsRef.current;
    
    // Si c'est la première détection, simplement enregistrer les dimensions actuelles
    if (!prevDimensions) {
      prevDimensionsRef.current = currentDimensions;
      return;
    }
    
    // Vérifier si les dimensions ont changé
    const hasChanged = 
      currentDimensions.width !== prevDimensions.width ||
      currentDimensions.height !== prevDimensions.height ||
      currentDimensions.columnsCount !== prevDimensions.columnsCount;
    
    if (hasChanged) {
      console.log('Grid dimensions changed', {
        from: prevDimensions,
        to: currentDimensions
      });
      
      // Appeler le callback avec les nouvelles et anciennes dimensions
      onDimensionChange(currentDimensions, prevDimensions, gridRef);
      
      // Mettre à jour les dimensions précédentes
      prevDimensionsRef.current = currentDimensions;
    }
  // Inclure les dépendances additionnelles
  }, [gridRef, onDimensionChange, ...dependencies]);
}
