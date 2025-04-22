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
      <div className={isMobile ? "flex items-center gap-1 z-20" : "flex items-center gap-3 z-20"}>
        {/* Inversé: bouton gauche = mois suivant */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className={
            isMobile
              ? "bg-white dark:bg-neutral-700 rounded-full p-1 shadow hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-1 focus:ring-primary focus:outline-none min-w-[28px] min-h-[28px] w-7 h-7"
              : "bg-white dark:bg-neutral-700 rounded-full p-1 shadow-lg hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-2 focus:ring-primary focus:outline-none min-w-[32px] min-h-[32px]"
          }
          aria-label="Mois suivant (inversé)"
        >
          <ArrowLeft size={isMobile ? 16 : 22} />
        </Button>
        <Button
          variant="ghost"
          onClick={e => { e.stopPropagation(); setCalendarOpen(true); }}
          className={
            `font-semibold shadow-xl rounded-full border-2 transition focus:ring-1 focus:ring-primary focus:outline-none ` +
            (isMobile
              ? 'bg-white dark:bg-neutral-700 text-primary dark:text-white px-3 py-1 text-xs border-primary dark:border-primary-foreground min-w-[60px] max-w-[80px] h-7'
              : 'bg-white dark:bg-neutral-700 text-primary dark:text-white px-8 py-2 text-lg md:text-xl border-primary dark:border-primary-foreground min-w-[240px] max-w-[320px]')
          }
          aria-label="Sélecteur de mois"
        >
          <span className="truncate block text-center">
            {displayLabel}
          </span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrev}
          className={
            isMobile
              ? "bg-white dark:bg-neutral-700 rounded-full p-1 shadow hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-1 focus:ring-primary focus:outline-none min-w-[28px] min-h-[28px] w-7 h-7"
              : "bg-white dark:bg-neutral-700 rounded-full p-1 shadow-lg hover:bg-primary/90 hover:text-white text-primary dark:text-white border border-primary dark:border-primary-foreground transition focus:ring-2 focus:ring-primary focus:outline-none min-w-[32px] min-h-[32px]"
          }
          aria-label="Mois précédent (inversé)"
        >
          <ArrowRight size={isMobile ? 16 : 22} />
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
      <div className="flex items-center justify-center text-gray-500">
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 4.5h16.5M3.75 9h16.5M3.75 13.5h16.5M3.75 18h16.5"
            />
          </svg>
          <span className="text-xs">{mediaIds.length}</span>
        </span>
      </div>
    </>
  );

  const rightGalleryToolbar = (
    <>
      <div className="flex items-center justify-center text-gray-500">
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 4.5h16.5M3.75 9h16.5M3.75 13.5h16.5M3.75 18h16.5"
            />
          </svg>
          <span className="text-xs">{mediaIds.length}</span>
        </span>
      </div>
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
