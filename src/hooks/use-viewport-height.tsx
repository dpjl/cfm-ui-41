
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
    
    // Log pour debug
    console.log(`Viewport height updated: ${window.innerHeight}px (--real-vh: ${vh}px)`);
  }, []);

  useEffect(() => {
    // Suppression de la condition isMobile pour appliquer sur tous les appareils
    
    // Appliquer initialement
    updateViewportHeight();
    
    // Écouter les événements pertinents
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Écouteur spécifique pour iOS - déclenché lors du défilement
    if (isMobile) {
      window.addEventListener('scroll', updateViewportHeight, { passive: true });
    }
    
    // Appliquer après un court délai pour gérer certains cas spécifiques
    const timeoutId = setTimeout(updateViewportHeight, 300);
    
    // Appliquer également lors de l'interaction avec la page
    window.addEventListener('touchstart', updateViewportHeight, { passive: true });
    window.addEventListener('click', updateViewportHeight, { passive: true });
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      window.removeEventListener('touchstart', updateViewportHeight);
      window.removeEventListener('click', updateViewportHeight);
      if (isMobile) {
        window.removeEventListener('scroll', updateViewportHeight);
      }
      clearTimeout(timeoutId);
    };
  }, [isMobile, updateViewportHeight]);

  // Exécuter immédiatement lors de l'invocation du hook
  useEffect(() => {
    // Force une mise à jour initiale
    updateViewportHeight();
  }, [updateViewportHeight]);
}
