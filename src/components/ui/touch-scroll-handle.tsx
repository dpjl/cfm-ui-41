
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';

interface TouchScrollHandleProps {
  scrollableRef: React.RefObject<HTMLElement>;
  position?: 'left' | 'right' | 'center';
  className?: string;
}

const TouchScrollHandle: React.FC<TouchScrollHandleProps> = ({
  scrollableRef,
  position = 'right',
  className
}) => {
  const isMobile = useIsMobile();
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Calcule la hauteur et la position du handle
  const updateHandlePosition = useCallback(() => {
    if (!scrollableRef.current || !handleRef.current) return;
    
    const container = scrollableRef.current;
    const totalHeight = container.scrollHeight;
    const viewHeight = container.clientHeight;
    
    // Ne rien faire si le contenu ne nécessite pas de défilement
    if (totalHeight <= viewHeight) {
      setIsVisible(false);
      return;
    }
    
    const ratio = viewHeight / totalHeight;
    const handleHeight = Math.max(50, Math.floor(viewHeight * ratio)); 
    const maxScrollTop = totalHeight - viewHeight;
    const scrollPercentage = container.scrollTop / maxScrollTop;
    const handleTop = scrollPercentage * (viewHeight - handleHeight);
    
    if (handleRef.current) {
      handleRef.current.style.height = `${handleHeight}px`;
      handleRef.current.style.transform = `translateY(${handleTop}px)`;
    }
    
    setScrollRatio(ratio);
    setScrollPosition(scrollPercentage);
    setIsVisible(true);
  }, [scrollableRef]);
  
  // Gestion du défilement
  useEffect(() => {
    if (!isMobile || !scrollableRef.current) return;
    
    const container = scrollableRef.current;
    
    const handleScroll = () => {
      updateHandlePosition();
      showHandleTemporarily();
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      updateHandlePosition();
    });
    
    resizeObserver.observe(container);
    
    // Initialisation
    updateHandlePosition();
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isMobile, scrollableRef, updateHandlePosition]);
  
  // Affiche le handle temporairement lors du défilement
  const showHandleTemporarily = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(true);
    
    // Cacher après un délai sauf si en cours de glissement
    if (!isDragging) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1500); // Disparaît après 1.5s d'inactivité
    }
  }, [isDragging]);
  
  // Gestionnaires d'événements tactiles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    
    // Position initiale du toucher
    const touch = e.touches[0];
    const initialY = touch.clientY;
    
    // Référence à l'élément conteneur
    const container = scrollableRef.current;
    if (!container) return;
    
    // Hauteur visible du conteneur
    const viewHeight = container.clientHeight;
    // Hauteur totale du contenu
    const totalHeight = container.scrollHeight;
    // Différence entre la hauteur totale et la hauteur visible
    const scrollRange = totalHeight - viewHeight;
    
    // Fonction pour gérer le déplacement du doigt
    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
      const currentTouch = moveEvent.touches[0];
      const deltaY = currentTouch.clientY - initialY;
      
      // Convertir le mouvement du doigt en défilement
      // Un facteur plus élevé pour un défilement plus rapide
      const scrollFactor = 1.5 / scrollRatio;
      const newScrollTop = container.scrollTop + (deltaY * scrollFactor);
      
      // Appliquer le défilement
      container.scrollTop = Math.max(0, Math.min(scrollRange, newScrollTop));
      
      // Mettre à jour la position du handle
      updateHandlePosition();
    };
    
    // Fonction pour arrêter le glissement
    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      // Cacher après un délai
      showHandleTemporarily();
    };
    
    // Ajouter les écouteurs globaux
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  }, [scrollableRef, scrollRatio, updateHandlePosition, showHandleTemporarily]);
  
  // Ne pas rendre sur desktop ou si non visible
  if (!isMobile) return null;
  
  return (
    <div 
      ref={handleRef}
      className={cn(
        "touch-scroll-handle",
        position === 'right' && "touch-scroll-handle-right",
        position === 'left' && "touch-scroll-handle-left",
        position === 'center' && "touch-scroll-handle-center",
        isDragging && "touch-scroll-handle-active",
        isVisible ? "touch-scroll-handle-visible" : "touch-scroll-handle-hidden",
        className
      )}
      onTouchStart={handleTouchStart}
      aria-hidden="true" // Dissimulé pour les lecteurs d'écran
    />
  );
};

export default TouchScrollHandle;
