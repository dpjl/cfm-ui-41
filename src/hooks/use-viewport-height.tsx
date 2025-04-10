
import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-breakpoint';

/**
 * Hook qui calcule et met à jour la hauteur réelle du viewport sur tous les appareils
 * Cette approche résout les problèmes de hauteur inconsistante sur les navigateurs
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
    
    // Log détaillé pour debug
    console.log(`Viewport height updated: ${window.innerHeight}px (--real-vh: ${vh}px)`);
    
    // Vérifier que la variable est bien appliquée
    const appliedVh = getComputedStyle(document.documentElement).getPropertyValue('--real-vh');
    console.log(`Applied --real-vh value: ${appliedVh}`);
    
    // Vérifier tous les éléments avec la classe h-viewport-safe
    const safeElements = document.querySelectorAll('.h-viewport-safe');
    console.log(`Found ${safeElements.length} elements with h-viewport-safe class`);
    safeElements.forEach((el, i) => {
      const computedHeight = getComputedStyle(el).height;
      console.log(`Element ${i+1} height: ${computedHeight}`);
    });
  }, []);

  useEffect(() => {
    // Appliquer initialement
    updateViewportHeight();
    
    // Écouter les événements pertinents
    window.addEventListener('resize', updateViewportHeight, { passive: true });
    window.addEventListener('orientationchange', updateViewportHeight, { passive: true });
    
    // Écouteur spécifique pour iOS - déclenché lors du défilement
    if (isMobile) {
      window.addEventListener('scroll', updateViewportHeight, { passive: true });
    }
    
    // Appliquer après un court délai pour gérer certains cas spécifiques
    const timeoutIds = [
      setTimeout(updateViewportHeight, 100),
      setTimeout(updateViewportHeight, 300),
      setTimeout(updateViewportHeight, 500)
    ];
    
    // Appliquer également lors de l'interaction avec la page
    window.addEventListener('touchstart', updateViewportHeight, { passive: true });
    window.addEventListener('click', updateViewportHeight, { passive: true });
    window.addEventListener('load', updateViewportHeight, { passive: true });
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('touchstart', updateViewportHeight);
      window.removeEventListener('click', updateViewportHeight);
      window.removeEventListener('load', updateViewportHeight);
      if (isMobile) {
        window.removeEventListener('scroll', updateViewportHeight);
      }
      timeoutIds.forEach(id => clearTimeout(id));
    };
  }, [isMobile, updateViewportHeight]);

  // Force une réexécution après le premier rendu
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      updateViewportHeight();
    });
    return () => cancelAnimationFrame(id);
  }, [updateViewportHeight]);
}
