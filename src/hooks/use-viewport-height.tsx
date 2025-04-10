
import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-breakpoint';

/**
 * Hook qui calcule et met à jour la hauteur réelle du viewport sur les appareils mobiles
 * Cette approche résout les problèmes de hauteur inconsistante sur les navigateurs mobiles
 * notamment lors de l'apparition/disparition des barres d'UI
 */
export function useViewportHeight() {
  const isMobile = useIsMobile();
  
  // Fonction pour calculer et appliquer la hauteur réelle du viewport
  const updateViewportHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Obtenir la hauteur réelle du viewport
    const vh = window.innerHeight * 0.01;
    // Définir la variable CSS personnalisée
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    
    // Log pour debug
    console.log(`Viewport height updated: ${window.innerHeight}px (--real-vh: ${vh}px)`);
  }, []);

  useEffect(() => {
    // Ne s'applique que sur mobile
    if (!isMobile) return;
    
    // Appliquer initialement
    updateViewportHeight();
    
    // Écouter les événements pertinents
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Écouteur spécifique pour iOS - déclenché lors du défilement
    window.addEventListener('scroll', updateViewportHeight, { passive: true });
    
    // Appliquer après un court délai pour gérer certains cas spécifiques sur iOS
    const timeoutId = setTimeout(updateViewportHeight, 300);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('scroll', updateViewportHeight);
      clearTimeout(timeoutId);
    };
  }, [isMobile, updateViewportHeight]);
}
