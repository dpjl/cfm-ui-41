
import React, { useEffect } from 'react';
import { LanguageProvider } from '@/hooks/use-language';
import ServerStatusPanel from '@/components/ServerStatusPanel';
import GalleryLayout from '@/components/layout/GalleryLayout';
import GalleryPageHeader from '@/components/layout/GalleryPageHeader';
import { useGalleryContext } from '@/contexts/GalleryContext';

const Index = () => {
  const galleryState = useGalleryContext();
  
  const isSidebarOpen = galleryState.leftPanelOpen || galleryState.rightPanelOpen;

  // Force un rafraîchissement du layout après le montage
  useEffect(() => {
    const handleResize = () => {
      // Force un redimensionnement pour s'assurer que tous les calculs sont à jour
      window.dispatchEvent(new Event('resize'));
    };
    
    // Exécuter après le montage
    handleResize();
    
    // Et aussi après un court délai pour s'assurer que le DOM est complètement chargé
    const timeoutId = setTimeout(handleResize, 200);
    
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <LanguageProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
        <ServerStatusPanel 
          isOpen={galleryState.serverPanelOpen}
          onOpenChange={galleryState.setServerPanelOpen}
        />
        
        <GalleryPageHeader 
          onRefresh={galleryState.handleRefresh}
          isDeletionPending={galleryState.deleteMutation.isPending}
          isSidebarOpen={isSidebarOpen}
          onCloseSidebars={galleryState.closeBothSidebars}
          mobileViewMode={galleryState.viewMode}
          setMobileViewMode={galleryState.setViewMode}
          selectedIdsLeft={galleryState.selectedIdsLeft}
          selectedIdsRight={galleryState.selectedIdsRight}
          onDelete={galleryState.handleDelete}
          onToggleServerPanel={() => galleryState.setServerPanelOpen(!galleryState.serverPanelOpen)}
          isServerPanelOpen={galleryState.serverPanelOpen}
        />
        
        <GalleryLayout />
      </div>
    </LanguageProvider>
  );
};

export default Index;
