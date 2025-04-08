
import { useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import type { FixedSizeGrid } from 'react-window';

interface GridDimensions {
  width: number;
  height: number;
  columnsCount: number;
}

/**
 * Hook qui détecte les changements de dimensions d'une grille
 * et appelle un callback lorsque ces dimensions changent
 * Optimisé avec debounce pour éviter les appels trop fréquents
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
  
  // Fonction pour vérifier et comparer les dimensions
  const checkDimensions = useCallback(() => {
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
  }, [gridRef, onDimensionChange]);
  
  // Créer une version debounced de la fonction de vérification
  const debouncedCheckDimensions = useMemo(
    () => debounce(checkDimensions, 150), // 150ms donne un bon équilibre entre réactivité et performance
    [checkDimensions]
  );
  
  // Utiliser useLayoutEffect pour observer les changements de dimensions
  useLayoutEffect(() => {
    if (!gridRef?.current) return;
    
    // Vérifier les dimensions au montage initial
    checkDimensions();
    
    // Observer les changements de l'élément DOM de la grille
    const gridElement = gridRef.current._outerRef;
    if (!gridElement) return;
    
    // Utiliser ResizeObserver pour détecter les changements de taille du conteneur de la grille
    const resizeObserver = new ResizeObserver(debouncedCheckDimensions);
    resizeObserver.observe(gridElement);
    
    // Nettoyer les ressources lors du démontage
    return () => {
      resizeObserver.disconnect();
      debouncedCheckDimensions.cancel(); // Important: annuler le debounce en attente
    };
  }, [gridRef, checkDimensions, debouncedCheckDimensions, ...dependencies]);
}
