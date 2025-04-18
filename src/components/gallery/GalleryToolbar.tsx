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
import DateSelector from './DateSelector';

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
  mobileViewMode?: GalleryViewMode;
  onToggleFullView?: () => void;
  onNavigateToPreviousMonth?: () => void;
  onNavigateToNextMonth?: () => void;
  currentMonthLabel: string;
  onMonthSelect?: () => void;
  showMonthNavigation?: boolean;
  years: number[];
  monthsByYear: Map<number, number[]>;
  onSelectYearMonth: (year: number, month: number) => void;
}

const MonthNavigationGroup: React.FC<{
  onPrev?: () => void;
  onNext?: () => void;
  onMonthSelect?: () => void;
  currentMonthLabel: string;
  years: number[];
  monthsByYear: Map<number, number[]>;
  onSelectYearMonth: (year: number, month: number) => void;
  position: 'source' | 'destination';
}> = ({ onPrev, onNext, onMonthSelect, currentMonthLabel, years, monthsByYear, onSelectYearMonth, position }) => {
  const isMobile = useIsMobile();

  // Abréviation du mois si mobile
  let displayLabel = currentMonthLabel;
  if (isMobile && currentMonthLabel.match(/^[A-Za-zéûîâôäëöüàèùçÉÈÊËÎÏÔÖÛÜÂÄÇ]+ [0-9]{4}$/)) {
    // Ex: "Avril 2025" => "04/25"
    const moisNoms = [
      'jan', 'fév', 'mar', 'avr', 'mai', 'jui', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'
    ];
    const [mois, annee] = currentMonthLabel.split(' ');
    let moisNum = moisNoms.findIndex(m => mois.toLowerCase().startsWith(m));
    if (moisNum === -1) moisNum = 0;
    const moisStr = (moisNum + 1).toString().padStart(2, '0');
    const anneeStr = annee.slice(-2);
    displayLabel = `${moisStr}/${anneeStr}`;
  }

  const [calendarOpen, setCalendarOpen] = React.useState(false);

  return (
    <>
      <div className={isMobile ? "flex items-center gap-2 z-20" : "flex items-center gap-3 z-20"}>
        {/* Inversé: bouton gauche = mois suivant */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="bg-white dark:bg-neutral-700 rounded-full p-1 shadow-lg hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label="Mois suivant (inversé)"
          style={{ minWidth: isMobile ? 32 : 40, minHeight: isMobile ? 32 : 40 }}
        >
          <ArrowLeft size={isMobile ? 15 : 22} />
        </Button>
        <Button
          variant="ghost"
          onClick={e => { e.stopPropagation(); setCalendarOpen(true); }}
          className={
            `font-semibold shadow-xl rounded-full border-2 transition focus:ring-2 focus:ring-primary focus:outline-none ` +
            (isMobile
              ? 'bg-white dark:bg-neutral-700 text-primary dark:text-white px-4 py-0.5 text-xs border-primary dark:border-primary-foreground'
              : 'bg-white dark:bg-neutral-700 text-primary dark:text-white px-8 py-2 text-lg md:text-xl border-primary dark:border-primary-foreground')
          }
          aria-label="Sélecteur de mois"
          style={{ minWidth: isMobile ? 90 : 240, maxWidth: isMobile ? 120 : 320 }}
        >
          <span className="truncate block text-center">
            {displayLabel}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className="bg-white dark:bg-neutral-700 rounded-full p-1 shadow-lg hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-2 focus:ring-primary focus:outline-none"
          aria-label="Mois précédent (inversé)"
          style={{ minWidth: isMobile ? 32 : 40, minHeight: isMobile ? 32 : 40 }}
        >
          <ArrowRight size={isMobile ? 15 : 22} />
        </Button>
      </div>
      <DateSelector
        years={years}
        monthsByYear={monthsByYear}
        onSelectYearMonth={(year, month) => {
          onSelectYearMonth(year, month);
          setCalendarOpen(false);
        }}
        position={position}
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
      />
    </>
  );
};

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
  onNavigateToNextMonth,
  currentMonthLabel,
  onMonthSelect,
  showMonthNavigation = false,
  years,
  monthsByYear,
  onSelectYearMonth
}) => {
  const isMobile = useIsMobile();
  const isFullView = (position === 'source' && mobileViewMode === 'left') || 
                     (position === 'destination' && mobileViewMode === 'right');

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
                <div className="flex items-center justify-center">
                  <Settings size={isMobile ? 14 : 16} />
                </div>
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

  const rightGalleryToolbar = (
    <>
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
                <div className="flex items-center justify-center">
                  <Settings size={isMobile ? 14 : 16} />
                </div>
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

  if (showMonthNavigation) {
    return (
      <MonthNavigationGroup
        onPrev={onNavigateToPreviousMonth}
        onNext={onNavigateToNextMonth}
        onMonthSelect={onMonthSelect}
        currentMonthLabel={currentMonthLabel}
        years={years}
        monthsByYear={monthsByYear}
        onSelectYearMonth={onSelectYearMonth}
        position={position}
      />
    );
  }

  return (
    <div className="flex items-center justify-between space-x-2 py-2 relative">
      <div className="flex items-center space-x-1">
        {position === 'source' && leftGalleryToolbar}
      </div>
      <div className="flex items-center space-x-1 ml-auto">
        {position === 'destination' && rightGalleryToolbar}
      </div>
    </div>
  );
};

export default GalleryToolbar;
