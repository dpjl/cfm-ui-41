import React, { useState } from 'react';
import SidePanel from '@/components/layout/SidePanel';
import GalleriesContainer from '@/components/layout/GalleriesContainer';
import AppSidebar from '@/components/AppSidebar';
import { useGalleryContext } from '@/contexts/GalleryContext';
import { useViewportHeight } from '@/hooks/use-viewport-height';

const GalleryLayout: React.FC = () => {
  // Activer le calcul de hauteur adaptative pour le viewport
  useViewportHeight();
  
  const {
    // Directory selection
    selectedDirectoryIdLeft,
    setSelectedDirectoryIdLeft,
    selectedDirectoryIdRight,
    setSelectedDirectoryIdRight,
    
    // Column management
    getCurrentColumnsLeft,
    getCurrentColumnsRight,
    updateColumnCount,
    
    // Selection state
    selectedIdsLeft,
    setSelectedIdsLeft,
    selectedIdsRight,
    setSelectedIdsRight,
    
    // Dialog state
    deleteDialogOpen,
    setDeleteDialogOpen,
    activeSide,
    deleteMutation,
    handleDeleteSelected,
    handleDelete,
    
    // Panel state
    leftPanelOpen,
    toggleLeftPanel,
    rightPanelOpen,
    toggleRightPanel,
    
    // View mode
    viewMode,
    setViewMode,
    
    // Filters
    leftFilter,
    setLeftFilter,
    rightFilter,
    setRightFilter,
    
    // Utilities
    isMobile,
    getViewModeType
  } = useGalleryContext();
  
  // Récupérer le nombre de colonnes
  const columnsCountLeft = getCurrentColumnsLeft();
  const columnsCountRight = getCurrentColumnsRight();
  
  // Récupérer le type de vue actuel
  const currentViewMode = getViewModeType('left');
  
  // Get column values for left and right sides
  const leftColumnValues = getColumnValuesForViewMode('left');
  const rightColumnValues = getColumnValuesForViewMode('right');
  
  // Helper function to get column values in the correct format for the AppSidebar
  function getColumnValuesForViewMode(side: 'left' | 'right') {
    const viewModeType = getViewModeType(side);
    return {
      'desktop': side === 'left' ? columnsCountLeft : columnsCountRight,
      'desktop-single': side === 'left' ? columnsCountLeft : columnsCountRight,
      'mobile-split': side === 'left' ? columnsCountLeft : columnsCountRight,
      'mobile-single': side === 'left' ? columnsCountLeft : columnsCountRight
    };
  }
  
  const [pathRegexInputLeft, setPathRegexInputLeft] = useState('');
  const [pathRegexLeft, setPathRegexLeft] = useState('');
  const [pathRegexInputRight, setPathRegexInputRight] = useState('');
  const [pathRegexRight, setPathRegexRight] = useState('');

  const handleValidatePathRegexLeft = () => setPathRegexLeft(pathRegexInputLeft);
  const handleValidatePathRegexRight = () => setPathRegexRight(pathRegexInputRight);

  return (
    <div className="flex overflow-hidden mt-2 relative" style={{height: 'calc(var(--real-vh, 1vh) * 100)'}}> 
      <SidePanel 
        position="left" 
        isOpen={leftPanelOpen} 
        onOpenChange={toggleLeftPanel}
        title="Source"
        viewMode={viewMode}
      >
        <AppSidebar
          selectedDirectoryId={selectedDirectoryIdLeft}
          onSelectDirectory={setSelectedDirectoryIdLeft}
          position="left"
          selectedFilter={leftFilter}
          onFilterChange={setLeftFilter}
          mobileViewMode={viewMode}
          onColumnsChange={(count) => updateColumnCount('left', count)}
          columnValues={leftColumnValues}
          currentViewMode={currentViewMode}
          pathRegex={pathRegexInputLeft}
          onPathRegexChange={setPathRegexInputLeft}
          onValidatePathRegex={handleValidatePathRegexLeft}
        />
      </SidePanel>

      <div className="flex-1 flex flex-col overflow-hidden">
        <GalleriesContainer 
          columnsCountLeft={columnsCountLeft}
          columnsCountRight={columnsCountRight}
          selectedIdsLeft={selectedIdsLeft}
          setSelectedIdsLeft={setSelectedIdsLeft}
          selectedIdsRight={selectedIdsRight}
          setSelectedIdsRight={setSelectedIdsRight}
          selectedDirectoryIdLeft={selectedDirectoryIdLeft}
          selectedDirectoryIdRight={selectedDirectoryIdRight}
          deleteDialogOpen={deleteDialogOpen}
          setDeleteDialogOpen={setDeleteDialogOpen}
          activeSide={activeSide}
          deleteMutation={deleteMutation}
          handleDeleteSelected={handleDeleteSelected}
          handleDelete={handleDelete}
          mobileViewMode={viewMode}
          setMobileViewMode={setViewMode}
          leftFilter={leftFilter}
          rightFilter={rightFilter}
          onToggleLeftPanel={toggleLeftPanel}
          onToggleRightPanel={toggleRightPanel}
          onColumnsChange={(side, count) => updateColumnCount(side, count)}
          pathRegexLeft={pathRegexLeft}
          pathRegexRight={pathRegexRight}
        />
      </div>

      <SidePanel 
        position="right" 
        isOpen={rightPanelOpen} 
        onOpenChange={toggleRightPanel}
        title="Destination"
        viewMode={viewMode}
      >
        <AppSidebar
          selectedDirectoryId={selectedDirectoryIdRight}
          onSelectDirectory={setSelectedDirectoryIdRight}
          position="right"
          selectedFilter={rightFilter}
          onFilterChange={setRightFilter}
          mobileViewMode={viewMode}
          onColumnsChange={(count) => updateColumnCount('right', count)}
          columnValues={rightColumnValues}
          currentViewMode={currentViewMode}
          pathRegex={pathRegexInputRight}
          onPathRegexChange={setPathRegexInputRight}
          onValidatePathRegex={handleValidatePathRegexRight}
        />
      </SidePanel>
    </div>
  );
};

export default GalleryLayout;
