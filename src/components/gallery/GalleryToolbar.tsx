
import React from 'react';
import { Button } from '../ui/button';
import { SelectionMode } from '../../hooks/use-gallery-selection';
import { useMediaQuery } from '../../hooks/use-media-query';
import { 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  ChevronRight, 
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
  // Nouvelles props pour le toggle de vue
  mobileViewMode?: GalleryViewMode;
  onToggleFullView?: () => void;
  // Nouvelles props pour la navigation mensuelle
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
  
  // Définir l'icône du bouton sidebar selon la position (gauche/droite)
  const SidebarIcon = position === 'source' ? ChevronLeft : ChevronRight;
  const SidebarLabel = position === 'source' ? 'Options Left' : 'Options Right';

  // Détermine si on est en vue plein écran pour cette galerie
  const isFullView = (position === 'source' && mobileViewMode === 'left') || 
                     (position === 'destination' && mobileViewMode === 'right');

  // Boutons de navigation mensuelle (uniquement sur desktop)
  const monthNavigationButtons = !isMobile && onNavigateToPreviousMonth && onNavigateToNextMonth ? (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigateToPreviousMonth}
              className="h-8 w-8"
            >
              <ArrowLeft size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Mois précédent</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onNavigateToNextMonth}
              className="h-8 w-8"
            >
              <ArrowRight size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Mois suivant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  ) : null;

  // Pour la galerie de gauche (source), ordre: sidebar, select all, clear, mode, navigation, view toggle
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
                    <ChevronLeft size={isMobile ? 16 : 18} className="text-muted-foreground" />
                    <Settings size={isMobile ? 14 : 16} className="ml-[-4px]" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} className="mr-[-4px]" />
                    <ChevronRight size={isMobile ? 16 : 18} className="text-muted-foreground" />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{SidebarLabel}</p>
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
              onClick={onSelectAll}
              disabled={mediaIds.length === 0}
              className="h-8 w-8"
            >
              <CheckSquare size={isMobile ? 18 : 20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Select All</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {selectedIds.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onDeselectAll}
                className="h-8 w-8"
              >
                <Square size={isMobile ? 18 : 20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear Selection</p>
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

      {/* Boutons de navigation mensuelle (uniquement sur desktop) */}
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

  // Pour la galerie de droite (destination), ordre: view toggle, navigation, mode, clear, select all, sidebar
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

      {/* Boutons de navigation mensuelle (uniquement sur desktop) */}
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
      
      {selectedIds.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={onDeselectAll}
                className="h-8 w-8"
              >
                <Square size={isMobile ? 18 : 20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Clear Selection</p>
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
              onClick={onSelectAll}
              disabled={mediaIds.length === 0}
              className="h-8 w-8"
            >
              <CheckSquare size={isMobile ? 18 : 20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Select All</p>
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
                    <ChevronLeft size={isMobile ? 16 : 18} className="text-muted-foreground" />
                    <Settings size={isMobile ? 14 : 16} className="ml-[-4px]" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Settings size={isMobile ? 14 : 16} className="mr-[-4px]" />
                    <ChevronRight size={isMobile ? 16 : 18} className="text-muted-foreground" />
                  </div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{SidebarLabel}</p>
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
