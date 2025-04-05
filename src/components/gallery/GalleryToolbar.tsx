
import React from 'react';
import { Button } from '../ui/button';
import { SelectionMode } from '../../hooks/use-gallery-selection';
import { useMediaQuery } from '../../hooks/use-media-query';
import { 
  CheckSquare, 
  Settings, 
  Maximize, 
  Minimize,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { GalleryViewMode } from '@/types/gallery';

interface GalleryToolbarProps {
  directory?: string;
  showSidePanel?: () => void;
  mediaIds: string[];
  selectedIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  viewMode?: 'single' | 'split';
  position?: 'source' | 'destination';
  onToggleSidebar?: () => void;
  selectionMode: SelectionMode;
  onToggleSelectionMode: () => void;
  // Props pour le toggle de vue
  mobileViewMode?: GalleryViewMode;
  onToggleFullView?: () => void;
  // Props pour la navigation mensuelle
  onNavigateToPreviousMonth?: () => void;
  onNavigateToNextMonth?: () => void;
}

const GalleryToolbar: React.FC<GalleryToolbarProps> = ({ 
  mediaIds,
  selectedIds,
  onSelectAll,
  onDeselectAll,
  viewMode = 'single',
  position = 'source',
  onToggleSidebar,
  selectionMode,
  onToggleSelectionMode,
  mobileViewMode = 'both',
  onToggleFullView,
  onNavigateToPreviousMonth,
  onNavigateToNextMonth
}) => {
  const isMobile = useIsMobile();
  
  // Détermine si on est en vue plein écran pour cette galerie
  const isFullView = (position === 'source' && mobileViewMode === 'left') || 
                     (position === 'destination' && mobileViewMode === 'right');

  // Création des boutons de navigation mensuelle (maintenant toujours visibles)
  const monthNavigationButtons = onNavigateToPreviousMonth && onNavigateToNextMonth ? (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigateToNextMonth} // MODIFIÉ: Inversé avec onNavigateToPreviousMonth pour correspondre à l'ordre chronologique
              className="h-8 w-8"
            >
              <ArrowLeft size={isMobile ? 16 : 18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Mois plus récent</p> {/* MODIFIÉ: Texte plus explicite */}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigateToPreviousMonth} // MODIFIÉ: Inversé avec onNavigateToNextMonth pour correspondre à l'ordre chronologique
              className="h-8 w-8"
            >
              <ArrowRight size={isMobile ? 16 : 18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Mois plus ancien</p> {/* MODIFIÉ: Texte plus explicite */}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  ) : null;

  // Pour la galerie de gauche (source)
  const leftGalleryToolbar = (
    <>
      {onToggleSidebar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleSidebar}
                className="h-8 w-8"
              >
                {position === 'source' ? (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSelectionMode}
              className="h-8 w-8"
            >
              {selectionMode === 'single' ? (
                <div className="relative">
                  <CheckSquare size={isMobile ? 18 : 20} />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">1</span>
                </div>
              ) : (
                <div className="relative">
                  <CheckSquare size={isMobile ? 18 : 20} />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">+</span>
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{selectionMode === 'single' ? 'Single Select' : 'Multi Select'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Boutons de navigation mensuelle (maintenant toujours visibles) */}
      {monthNavigationButtons}

      {/* Bouton Agrandir/Réduire pour la vue */}
      {onToggleFullView && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleFullView}
                className="h-8 w-8"
              >
                {isFullView ? (
                  <Minimize size={isMobile ? 18 : 20} />
                ) : (
                  <Maximize size={isMobile ? 18 : 20} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isFullView ? 'Split View' : 'Expand'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );

  // Pour la galerie de droite (destination)
  const rightGalleryToolbar = (
    <>
      {/* Bouton Agrandir/Réduire pour la vue */}
      {onToggleFullView && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleFullView}
                className="h-8 w-8"
              >
                {isFullView ? (
                  <Minimize size={isMobile ? 18 : 20} />
                ) : (
                  <Maximize size={isMobile ? 18 : 20} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isFullView ? 'Split View' : 'Expand'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Boutons de navigation mensuelle (maintenant toujours visibles) */}
      {monthNavigationButtons}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleSelectionMode}
              className="h-8 w-8"
            >
              {selectionMode === 'single' ? (
                <div className="relative">
                  <CheckSquare size={isMobile ? 18 : 20} />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">1</span>
                </div>
              ) : (
                <div className="relative">
                  <CheckSquare size={isMobile ? 18 : 20} />
                  <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">+</span>
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{selectionMode === 'single' ? 'Single Select' : 'Multi Select'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {onToggleSidebar && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleSidebar}
                className="h-8 w-8"
              >
                {position === 'source' ? (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Options</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );

  return (
    <div className="flex items-center justify-between space-x-2 py-2">
      {/* Galerie gauche: aligné à gauche */}
      <div className="flex items-center space-x-1">
        {position === 'source' && leftGalleryToolbar}
      </div>
      
      {/* Galerie droite: aligné à droite */}
      <div className="flex items-center space-x-1 ml-auto">
        {position === 'destination' && rightGalleryToolbar}
      </div>
    </div>
  );
};

export default GalleryToolbar;
