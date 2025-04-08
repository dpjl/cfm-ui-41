
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { cn } from '@/lib/utils';

interface TouchScrollHandleProps {
  scrollableRef: React.RefObject<HTMLElement>;
  position?: 'left' | 'right' | 'center';
  className?: string;
  alwaysVisible?: boolean;
}

const TouchScrollHandle: React.FC<TouchScrollHandleProps> = ({
  scrollableRef,
  position = 'right',
  className,
  alwaysVisible = false
}) => {
  const isMobile = useIsMobile();
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(alwaysVisible);
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
      if (!alwaysVisible) setIsVisible(false);
      return;
    }
    
    const ratio = viewHeight / totalHeight;
    const handleHeight = Math.max(100, Math.floor(viewHeight * ratio)); // Augmenté la taille minimale à 100px
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

    // Pour le débogage
    console.log("Handle updated", { 
      ratio, 
      handleHeight, 
      handleTop,
      isVisible: true,
      position
    });
  }, [scrollableRef, alwaysVisible, position]);
  
  // Gestion du défilement
  useEffect(() => {
    if (!isMobile || !scrollableRef.current) {
      console.log("Mobile detection or scrollable ref issue", { isMobile, hasRef: !!scrollableRef.current });
      return;
    }
    
    const container = scrollableRef.current;
    console.log("Touch scroll handle mounted for", position, container);
    
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
    // Délai pour s'assurer que le conteneur est complètement rendu
    setTimeout(() => {
      updateHandlePosition();
    }, 100);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isMobile, scrollableRef, updateHandlePosition, position]);
  
  // Affiche le handle temporairement lors du défilement
  const showHandleTemporarily = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(true);
    
    // Cacher après un délai sauf si en cours de glissement ou alwaysVisible
    if (!isDragging && !alwaysVisible) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 2500); // Augmenter à 2.5s
    }
  }, [isDragging, alwaysVisible]);
  
  // Gestionnaires d'événements tactiles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    console.log("Touch start on handle");
    
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
  
  // Ne pas rendre sur desktop
  if (!isMobile) return null;
  
  // Style forcé pour s'assurer que la position est toujours fixe
  const forceFixedStyle: React.CSSProperties = {
    position: 'fixed',
    height: '100px', // Taille par défaut minimale
    zIndex: 100,
    opacity: isVisible || alwaysVisible ? 0.9 : 0,
    pointerEvents: isVisible || isDragging || alwaysVisible ? 'auto' : 'none',
    top: '50%', // Positionne au milieu de l'écran par défaut
    transform: 'translateY(-50%)', // Centre verticalement
    ...(position === 'right' ? { right: '6px' } : {}),
    ...(position === 'left' ? { left: '6px' } : {}),
    ...(position === 'center' ? { left: '50%', transform: 'translate(-50%, -50%)' } : {})
  };
  
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
      data-handle-position={position}
      style={{
        ...forceFixedStyle,
        backgroundColor: isDragging ? 'rgba(var(--primary), 0.6)' : 'rgba(var(--primary), 0.4)'
      }}
    />
  );
};

export default TouchScrollHandle;
