import React from 'react';
import { Separator } from '@/components/ui/separator';
import { GalleryViewMode } from '@/types/gallery';
import { useGalleryLayout } from '@/hooks/use-gallery-layout';
import { FaLink } from 'react-icons/fa'; // Utilisation d'une icône plus moderne

interface GalleriesViewProps {
  // Mode de vue actuel 
  viewMode: GalleryViewMode;
  
  // Contenu des galeries
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  
  // Classes CSS supplémentaires (optionnel)
  className?: string;

  // Mode synchronisé
  syncMode: boolean;

  // Fonction pour basculer le mode synchronisé
  onToggleSyncMode: () => void;
}

const GalleriesView: React.FC<GalleriesViewProps> = ({
  viewMode,
  leftContent,
  rightContent,
  className = '',
  syncMode,
  onToggleSyncMode
}) => {
  const { getGalleryClasses, containerClasses, isGalleryVisible } = useGalleryLayout();

  return (
    <div className={`${containerClasses} h-full ${className} relative`}>
      {/* Bouton toggle synchronisation, positionné en overlay centré */}
      <button
        type="button"
        aria-label={syncMode ? 'Désactiver le mode synchronisé' : 'Activer le mode synchronisé'}
        onClick={onToggleSyncMode}
        className={`absolute z-30 top-2 left-1/2 -translate-x-1/2 rounded-full p-2 shadow transition-colors duration-150 border-2 ${syncMode ? 'bg-blue-500 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300'} hover:bg-blue-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
      >
        <FaLink size={22} className={syncMode ? 'rotate-45 transition-transform' : 'transition-transform'} />
      </button>
      <div className="flex h-full items-stretch">
        {/* Left Gallery - always mounted but conditionally visible */}
        <div className={getGalleryClasses('left')}>
          {isGalleryVisible('left') && (
            <div className="h-full">
              {leftContent}
            </div>
          )}
        </div>

        {/* Gallery Separator - only shown in split view */}
        {viewMode === 'both' && (
          <Separator orientation="vertical" className="bg-primary/30 w-[2px]" />
        )}

        {/* Right Gallery - always mounted but conditionally visible */}
        <div className={getGalleryClasses('right')}>
          {isGalleryVisible('right') && (
            <div className="h-full">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleriesView;
