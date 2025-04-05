
import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { getThumbnailUrl } from '@/api/imageApi';
import MediaItemRenderer from './media/MediaItemRenderer';
import { useMediaCache } from '@/hooks/use-media-cache';
import { useTouchInteractions } from '@/hooks/use-touch-interactions';
import { useKeyboardInteractions } from '@/hooks/use-keyboard-interactions';
import { useCombinedRef } from '@/hooks/use-combined-ref';
import MediaPlaceholder from './media/MediaPlaceholder';

interface LazyMediaItemProps {
  id: string;
  selected: boolean;
  onSelect: (id: string, extendSelection: boolean) => void;
  index: number;
  showDates?: boolean;
  updateMediaInfo?: (id: string, info: any) => void;
  position: 'source' | 'destination';
}

const LazyMediaItem = memo(({
  id,
  selected,
  onSelect,
  index,
  showDates = false,
  updateMediaInfo,
  position
}: LazyMediaItemProps) => {
  const [loaded, setLoaded] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Observer l'intersection pour le chargement paresseux
  const { elementRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ 
    threshold: 0.1, 
    freezeOnceVisible: true 
  });
  
  // Utiliser le cache pour les miniatures
  const { getCachedThumbnailUrl, setCachedThumbnailUrl } = useMediaCache();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  // Hooks pour les interactions tactiles et clavier
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchInteractions({
    id,
    onSelect,
  });
  
  const { handleKeyDown } = useKeyboardInteractions({
    id,
    onSelect,
  });
  
  // Référence combinée pour l'élément
  const setCombinedRef = useCombinedRef<HTMLDivElement>(elementRef, itemRef);
  
  // Gérer le clic sur l'élément
  const handleItemClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id, e.shiftKey || e.ctrlKey || e.metaKey);
  }, [id, onSelect]);
  
  // Charger l'URL de la miniature, en utilisant le cache si disponible
  useEffect(() => {
    if (isIntersecting) {
      const cachedUrl = getCachedThumbnailUrl(id, position);
      if (cachedUrl) {
        setThumbnailUrl(cachedUrl);
        return;
      }
      
      const url = getThumbnailUrl(id, position);
      setThumbnailUrl(url);
      setCachedThumbnailUrl(id, position, url);
    }
  }, [id, isIntersecting, position, getCachedThumbnailUrl, setCachedThumbnailUrl]);
  
  // Rendre uniquement un espace réservé lorsqu'il n'est pas visible
  if (!isIntersecting) {
    return <MediaPlaceholder ref={setCombinedRef} />;
  }
  
  // Déterminer si c'est une vidéo basé sur l'ID (implémentation simplifiée)
  // Note: Nous ne chargeons plus les infos détaillées, donc nous nous basons sur l'ID
  const isVideo = id.includes('vid-');
  
  return (
    <div
      ref={setCombinedRef}
      className={cn(
        "image-card group relative", 
        "aspect-square cursor-pointer", 
        selected && "selected",
      )}
      onClick={handleItemClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="button"
      aria-label={`Media item ${id}`}
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-media-id={id}
      data-selection-state={selected ? 'selected' : 'unselected'}
      style={{ touchAction: 'pan-y' }}
    >
      {thumbnailUrl && (
        <>
          <MediaItemRenderer
            mediaId={id}
            src={thumbnailUrl}
            alt={id}
            isVideo={Boolean(isVideo)}
            isSelected={selected}
            onLoad={() => setLoaded(true)}
            loaded={loaded}
          />

          <div className="image-overlay pointer-events-none" />
        </>
      )}
    </div>
  );
});

// Définir le nom d'affichage pour le débogage
LazyMediaItem.displayName = 'LazyMediaItem';

export default LazyMediaItem;
export type { LazyMediaItemProps }; // Export the props interface for better typing
