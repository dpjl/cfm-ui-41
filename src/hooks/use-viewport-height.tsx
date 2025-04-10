
import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-breakpoint';

/**
 * Hook qui calcule et met à jour la hauteur réelle du viewport sur tous les appareils
 * Utilise l'API Visual Viewport pour obtenir des mesures précises sur mobile
 * et résoudre les problèmes liés aux barres d'UI dynamiques
 */
export function useViewportHeight() {
  const isMobile = useIsMobile();
  
  // Fonction pour calculer et appliquer la hauteur réelle du viewport
  const updateViewportHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Utiliser Visual Viewport API si disponible, sinon utiliser window.innerHeight
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const vh = height * 0.01;
    
    // Définir la variable CSS personnalisée
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    
    // Log détaillé pour debug
    console.log(`Viewport height updated: ${height}px (--real-vh: ${vh}px) [using ${window.visualViewport ? 'Visual Viewport API' : 'window.innerHeight'}]`);
  }, []);

  useEffect(() => {
    // Appliquer initialement
    updateViewportHeight();
    
    // Si Visual Viewport API est disponible, utiliser ses événements
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
      
      // Nettoyage spécifique à Visual Viewport
      return () => {
        window.visualViewport.removeEventListener('resize', updateViewportHeight);
        window.visualViewport.removeEventListener('scroll', updateViewportHeight);
      };
    } 
    // Fallback pour les navigateurs sans support Visual Viewport
    else {
      // Écouter les événements standard
      window.addEventListener('resize', updateViewportHeight, { passive: true });
      window.addEventListener('orientationchange', updateViewportHeight, { passive: true });
      
      // Écouteurs spécifiques pour mobile
      if (isMobile) {
        window.addEventListener('scroll', updateViewportHeight, { passive: true });
        window.addEventListener('touchstart', updateViewportHeight, { passive: true });
      }
      
      // Appliquer après un court délai pour gérer certains cas spécifiques
      const timeoutId = setTimeout(updateViewportHeight, 300);
      
      // Nettoyage standard
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
        window.removeEventListener('orientationchange', updateViewportHeight);
        if (isMobile) {
          window.removeEventListener('scroll', updateViewportHeight);
          window.removeEventListener('touchstart', updateViewportHeight);
        }
        clearTimeout(timeoutId);
      };
    }
  }, [isMobile, updateViewportHeight]);

  // Force une réexécution après le premier rendu
  useEffect(() => {
    const id = requestAnimationFrame(updateViewportHeight);
    return () => cancelAnimationFrame(id);
  }, [updateViewportHeight]);
}
