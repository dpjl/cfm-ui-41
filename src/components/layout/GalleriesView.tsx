
import React from 'react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { GalleryViewMode } from '@/types/gallery';
import { useGalleryLayout } from '@/hooks/use-gallery-layout';

// Define container animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.3
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isGalleryVisible('left') ? "visible" : "hidden"}
            className="h-full"
          >
            {leftContent}
          </motion.div>
        </div>

        {/* Gallery Separator - only shown in split view */}
        {viewMode === 'both' && (
          <Separator orientation="vertical" className="bg-primary/30 w-[2px]" />
        )}

        {/* Right Gallery - always mounted but conditionally visible */}
        <div className={getGalleryClasses('right')}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isGalleryVisible('right') ? "visible" : "hidden"}
            className="h-full"
          >
            {rightContent}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GalleriesView;
