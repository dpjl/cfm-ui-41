
import { useEffect, useCallback } from 'react';
import { useIsMobile } from './use-breakpoint';

interface UseMonthNavigationProps {
  navigateToPreviousMonth: () => boolean;
  navigateToNextMonth: () => boolean;
}

/**
 * Hook pour gérer la navigation mensuelle via des raccourcis clavier (Alt+Left/Right)
 */
export function useMonthNavigation({
  navigateToPreviousMonth,
  navigateToNextMonth
}: UseMonthNavigationProps) {
  const isMobile = useIsMobile();
  
  // Gestionnaire d'événement pour les raccourcis clavier
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ne pas activer sur mobile
    if (isMobile) return;
    
    // Vérifier si Alt est enfoncé
    if (e.altKey) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateToPreviousMonth();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateToNextMonth();
      }
    }
  }, [navigateToPreviousMonth, navigateToNextMonth, isMobile]);
  
  // Attacher/détacher l'écouteur d'événement
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
