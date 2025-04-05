
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-media-query';

/**
 * Hook pour calculer la hauteur réelle du viewport sur mobile et desktop
 * Prend en compte les barres de navigation et les zones de sécurité
 */
export function useViewportHeight() {
  const isMobile = useIsMobile();
  const [viewportHeight, setViewportHeight] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  
  // Calculer un ajustement pour les zones de sécurité en bas sur mobile
  const [bottomSafeArea, setBottomSafeArea] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fonction pour mettre à jour la hauteur du viewport
    const updateViewportHeight = () => {
      // Obtenir la hauteur de la fenêtre
      const windowHeight = window.innerHeight;
      setViewportHeight(windowHeight);
      
      // Calculer l'espace de sécurité en bas sur mobile
      if (isMobile) {
        // Utiliser les zones sûres CSS si disponibles, sinon une valeur estimée
        const safeAreaBottom = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0'
        );
        // Si aucune safe area n'est détectée, utiliser une valeur estimée pour les appareils mobiles
        setBottomSafeArea(safeAreaBottom || 15);
      } else {
        setBottomSafeArea(0);
      }
      
      // Mettre à jour la variable CSS pour utilisation dans le style global
      document.documentElement.style.setProperty('--vh', `${windowHeight * 0.01}px`);
    };

    // Mettre à jour la hauteur initialement
    updateViewportHeight();

    // Mettre à jour la hauteur lors du redimensionnement et du changement d'orientation
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', updateViewportHeight);
    
    // Sur mobile, gérer également les changements de hauteur lors du défilement 
    // (apparition/disparition de la barre d'adresse)
    if (isMobile) {
      window.addEventListener('scroll', updateViewportHeight);
    }

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
      if (isMobile) {
        window.removeEventListener('scroll', updateViewportHeight);
      }
    };
  }, [isMobile]);

  return {
    viewportHeight,
    bottomSafeArea,
    // Calculer la hauteur ajustée qui prend en compte les zones de sécurité
    adjustedHeight: viewportHeight - bottomSafeArea,
    // Variable CSS pour utilisation dans les styles
    viewportHeightCss: 'calc(var(--vh, 1vh) * 100)'
  };
}
