
import React, { useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { GalleryViewMode } from '@/types/gallery';
import { useGalleryLayout } from '@/hooks/use-gallery-layout';
import { useIsMobile } from '@/hooks/use-breakpoint';
import TouchScrollHandle from '@/components/ui/touch-scroll-handle';

interface GalleriesViewProps {
  // Mode de vue actuel 
  viewMode: GalleryViewMode;
  
  // Contenu des galeries
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  
  // Classes CSS supplémentaires (optionnel)
  className?: string;
}

const GalleriesView: React.FC<GalleriesViewProps> = ({
  viewMode,
  leftContent,
  rightContent,
  className = ''
}) => {
  const { getGalleryClasses, containerClasses, isGalleryVisible } = useGalleryLayout();
  const isMobile = useIsMobile();
  
  // Références aux éléments scrollables
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={`flex h-full ${isMobile && viewMode === 'both' ? 'mobile-gallery-dual' : ''}`}>
        {/* Left Gallery - always mounted but conditionally visible */}
        <div 
          className={getGalleryClasses('left')} 
          ref={leftScrollRef}
        >
          {isGalleryVisible('left') && (
            <div className="h-full">
              {leftContent}
            </div>
          )}
          
          {/* Poignée de défilement pour la galerie gauche */}
          {isMobile && isGalleryVisible('left') && (
            <TouchScrollHandle 
              scrollableRef={leftScrollRef} 
              position={viewMode === 'both' ? 'left' : 'right'} 
              alwaysVisible={true}
            />
          )}
        </div>

        {/* Gallery Separator - only shown in split view */}
        {viewMode === 'both' && (
          <Separator orientation="vertical" className="bg-primary/30 w-[2px]" />
        )}

        {/* Right Gallery - always mounted but conditionally visible */}
        <div 
          className={getGalleryClasses('right')}
          ref={rightScrollRef}
        >
          {isGalleryVisible('right') && (
            <div className="h-full">
              {rightContent}
            </div>
          )}
          
          {/* Poignée de défilement pour la galerie droite */}
          {isMobile && isGalleryVisible('right') && (
            <TouchScrollHandle 
              scrollableRef={rightScrollRef} 
              position="right" 
              alwaysVisible={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleriesView;
