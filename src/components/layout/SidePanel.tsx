import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight, ChevronDown, X, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { GalleryViewMode } from '@/types/gallery';

interface SidePanelProps {
  children: React.ReactNode;
  position: 'left' | 'right';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  viewMode?: GalleryViewMode;
}

const SidePanel: React.FC<SidePanelProps> = ({
  children,
  position,
  isOpen,
  onOpenChange,
  title,
  viewMode = 'both'
}) => {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowTrigger = () => {
    if (viewMode === 'both') return true;
    if (position === 'left' && viewMode === 'left') return true;
    if (position === 'right' && viewMode === 'right') return true;
    return false;
  };

  if (isMobile) {
    return <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>
          {/* Mobile trigger is handled externally */}
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] max-h-[85vh] rounded-t-xl">
          <div className="p-1 h-full overflow-hidden">
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-sm font-medium">{title}</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7" onClick={() => onOpenChange(false)}>
                <ChevronDown size={16} />
              </Button>
            </div>
            <div className="h-[calc(100%-2.5rem)] overflow-hidden">
              {children}
            </div>
          </div>
        </DrawerContent>
      </Drawer>;
  }

  const renderTriggerButton = () => {
    if (!shouldShowTrigger()) return null;
    const icon = position === 'left' ? <PanelLeft size={16} /> : <PanelRight size={16} />;
    const alignmentClass = position === 'left' ? 'left-0' : 'right-0';
    const borderRadiusClass = position === 'left' ? 'rounded-r-md' : 'rounded-l-md';
    return;
  };

  return <>
      {!isOpen && renderTriggerButton()}
      
      <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
        <SheetContent side={position} className={cn("w-72 p-0 border-0 shadow-lg bg-card/95 backdrop-blur-sm", position === 'left' ? "border-r" : "border-l")}>
          <div className="h-full flex flex-col p-0 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="text-sm font-medium">{title}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
                <X size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              {children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>;
};

export default SidePanel;
