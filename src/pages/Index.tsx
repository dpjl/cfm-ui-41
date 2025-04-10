
import React from 'react';
import { LanguageProvider } from '@/hooks/use-language';
import ServerStatusPanel from '@/components/ServerStatusPanel';
import GalleryLayout from '@/components/layout/GalleryLayout';
import GalleryPageHeader from '@/components/layout/GalleryPageHeader';
import { useGalleryContext } from '@/contexts/GalleryContext';

const Index = () => {
  const galleryState = useGalleryContext();
  const isSidebarOpen = galleryState.leftPanelOpen || galleryState.rightPanelOpen;

  return (
    <LanguageProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20" style={{height: 'calc(var(--real-vh, 1vh) * 100)'}}>
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
