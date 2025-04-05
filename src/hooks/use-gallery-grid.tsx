
import { useRef, useState, useCallback } from 'react';
import { FixedSizeGrid } from 'react-window';

export function useGalleryGrid() {
  const gridRef = useRef<FixedSizeGrid>(null);
  const [gridKey, setGridKey] = useState(0);
  const previousSizeRef = useRef({ width: 0, height: 0 });
  const scrollPositionRef = useRef(0);
  const lastResetTimeRef = useRef(0);
  
  // Logs pour debugging
  const debugLog = useCallback((message: string, data?: any) => {
    if (data) {
      console.log(`[useGalleryGrid] ${message}`, data);
    } else {
      console.log(`[useGalleryGrid] ${message}`);
    }
  }, []);

  // Incrémenter la clé de la grille pour forcer le rendu
  const refreshGrid = useCallback(() => {
    // Éviter les resets trop fréquents (throttling)
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      debugLog('Skipping grid refresh: too frequent');
      return;
    }
    
    debugLog('Refreshing grid by incrementing key');
    setGridKey(prev => prev + 1);
    lastResetTimeRef.current = now;
  }, [debugLog]);
  
  // Sauvegarder la position de défilement actuelle
  const saveScrollPosition = useCallback(() => {
    if (gridRef.current) {
      scrollPositionRef.current = gridRef.current.state.scrollTop;
      debugLog(`Saved scroll position: ${scrollPositionRef.current}`);
    } else {
      debugLog('Cannot save scroll position: grid ref is null');
    }
  }, [debugLog]);
  
  // Restaurer la position de défilement sauvegardée
  const restoreScrollPosition = useCallback(() => {
    if (gridRef.current && scrollPositionRef.current > 0) {
      debugLog(`Restoring scroll position: ${scrollPositionRef.current}`);
      gridRef.current.scrollTo({ scrollTop: scrollPositionRef.current });
    } else {
      debugLog(`Cannot restore scroll position: gridRef=${!!gridRef.current}, position=${scrollPositionRef.current}`);
    }
  }, [debugLog]);

  // Gérer le redimensionnement avec debounce
  const handleResize = useCallback((width: number, height: number) => {
    // Vérifier si le changement de taille est significatif
    const isSignificantChange = 
      Math.abs(previousSizeRef.current.width - width) > 5 || 
      Math.abs(previousSizeRef.current.height - height) > 5;
      
    debugLog(`Resize event: width=${width}, height=${height}, significant=${isSignificantChange}`);
    
    if (isSignificantChange) {
      // Sauvegarder la position avant la mise à jour
      saveScrollPosition();
      
      // Mettre à jour la référence de taille
      previousSizeRef.current = { width, height };
      
      // Forcer le rafraîchissement de la grille
      refreshGrid();
      
      // Restaurer la position après la mise à jour
      setTimeout(restoreScrollPosition, 50);
    }
  }, [saveScrollPosition, restoreScrollPosition, refreshGrid, debugLog]);

  return {
    gridRef,
    gridKey,
    scrollPositionRef,
    previousSizeRef,
    refreshGrid,
    saveScrollPosition,
    restoreScrollPosition,
    handleResize
  };
}
