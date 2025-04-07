
import { useRef, useState, useCallback } from 'react';
import { FixedSizeGrid } from 'react-window';

export function useGalleryGrid() {
  const gridRef = useRef<FixedSizeGrid>(null);
  const [gridKey, setGridKey] = useState(0);
  const lastResetTimeRef = useRef(0);

  // Incrémenter la clé de la grille pour forcer le rendu
  const refreshGrid = useCallback(() => {
    // Éviter les resets trop fréquents (throttling)
    const now = Date.now();
    if (now - lastResetTimeRef.current < 500) {
      return;
    }
    
    setGridKey(prev => prev + 1);
    lastResetTimeRef.current = now;
  }, []);

  return {
    gridRef,
    gridKey,
    refreshGrid
  };
}
