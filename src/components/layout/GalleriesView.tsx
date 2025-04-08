
import React from 'react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { GalleryViewMode } from '@/types/gallery';
import { useGalleryLayout } from '@/hooks/use-gallery-layout';

// Define container animation variants - mais sans transition de durée
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.1  // Réduit de 0.3 à 0.1 pour être beaucoup plus rapide
    }
  }
};

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

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex h-full">
        {/* Left Gallery - always mounted but conditionally visible */}
        <div className={getGalleryClasses('left')}>
          {isGalleryVisible('left') && leftContent}
        </div>

        {/* Gallery Separator - only shown in split view */}
        {viewMode === 'both' && (
          <Separator orientation="vertical" className="bg-primary/30 w-[2px]" />
        )}

        {/* Right Gallery - always mounted but conditionally visible */}
        <div className={getGalleryClasses('right')}>
          {isGalleryVisible('right') && rightContent}
        </div>
      </div>
    </div>
  );
};

export default GalleriesView;
