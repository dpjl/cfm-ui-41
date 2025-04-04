
import React from 'react';
import { Button } from '@/components/ui/button';
import { Server } from 'lucide-react';
import { GalleryViewMode } from '@/types/gallery';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTheme } from '@/hooks/use-theme';
import { useGalleryContext } from '@/contexts/GalleryContext';

interface PageHeaderProps {
  onRefresh: () => void;
  isDeletionPending: boolean;
  isSidebarOpen: boolean;
  onCloseSidebars: () => void;
  mobileViewMode: GalleryViewMode;
  setMobileViewMode: React.Dispatch<React.SetStateAction<GalleryViewMode>>;
  selectedIdsLeft: string[];
  selectedIdsRight: string[];
  onDelete: () => void;
  onToggleServerPanel: () => void;
  isServerPanelOpen: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  mobileViewMode,
  setMobileViewMode,
  onRefresh,
  isDeletionPending,
  onToggleServerPanel,
  isServerPanelOpen
}) => {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  
  return <header className="relative z-20 flex items-center justify-between gap-2 p-2 md:p-4 bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="flex items-center gap-3">
        <div>
          <img src="/logo3.png" alt="Logo" className="h-12 md:h-16" />
        </div>
        
        {/* Desktop view mode switcher */}
        {!isMobile}
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
        
        <Button onClick={onToggleServerPanel} variant={isServerPanelOpen ? "default" : "outline"} size={isMobile ? "icon" : "default"} className="relative">
          {isMobile ? <Server className="h-4 w-4" /> : <>
              <Server className="h-4 w-4 mr-2" />
              <span>Serveur</span>
            </>}
        </Button>
      </div>
    </header>;
};

export default PageHeader;
