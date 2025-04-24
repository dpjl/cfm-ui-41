import React, { createContext, useContext, useCallback, useState } from 'react';
import { throttle } from 'lodash';

interface ScrollSyncContextType {
  scrollTop: number;
  updateScroll: (newScrollTop: number, source: 'left' | 'right') => void;
  registerGrid: (ref: any, side: 'left' | 'right') => void;
}

const ScrollSyncContext = createContext<ScrollSyncContextType | null>(null);

export const ScrollSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [grids, setGrids] = useState<{ left?: any; right?: any }>({});

  const updateScroll = useCallback(
    throttle((newScrollTop: number, source: 'left' | 'right') => {
      setScrollTop(newScrollTop);
      
      // Synchroniser l'autre grille
      const targetGrid = source === 'left' ? grids.right : grids.left;
      if (targetGrid?.current) {
        targetGrid.current.scrollTo({ scrollTop: newScrollTop });
      }
    }, 16), // ~60fps
    [grids]
  );

  const registerGrid = useCallback((ref: any, side: 'left' | 'right') => {
    setGrids(prev => ({ ...prev, [side]: ref }));
  }, []);

  return (
    <ScrollSyncContext.Provider value={{ scrollTop, updateScroll, registerGrid }}>
      {children}
    </ScrollSyncContext.Provider>
  );
};

export const useScrollSync = () => {
  const context = useContext(ScrollSyncContext);
  if (!context) {
    throw new Error('useScrollSync must be used within a ScrollSyncProvider');
  }
  return context;
}; 