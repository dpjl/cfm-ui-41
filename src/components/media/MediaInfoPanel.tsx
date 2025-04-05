
import React, { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { X, Eye, Trash, Download } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { DetailedMediaInfo } from '@/api/imageApi';
import { SelectionMode } from '@/hooks/use-gallery-selection';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLazyMediaInfo } from '@/hooks/use-lazy-media-info';

interface MediaInfoPanelProps {
  mediaId?: string | null;
  onClose?: () => void;
  selectedIds: string[];
  onOpenPreview: (id: string) => void;
  onDeleteSelected: () => void;
  onDownloadSelected: (ids?: string[]) => void;
  mediaInfoMap?: Map<string, DetailedMediaInfo | null>;
  selectionMode: SelectionMode;
  position: 'source' | 'destination';
}

const MediaInfoPanel: React.FC<MediaInfoPanelProps> = ({
  mediaId,
  onClose,
  selectedIds,
  onOpenPreview,
  onDeleteSelected,
  onDownloadSelected,
  mediaInfoMap: externalMediaInfoMap,
  selectionMode,
  position
}) => {
  const isMobile = useIsMobile();
  const displayId = mediaId || (selectedIds.length > 0 ? selectedIds[0] : null);
  
  // Utiliser notre nouveau hook de chargement paresseux
  const {
    loadMediaInfo,
    getMediaInfo,
    isLoading,
    getError,
    mediaInfoMap: internalMediaInfoMap
  } = useLazyMediaInfo(position);
  
  // Déclencher le chargement des informations lorsque le panneau s'ouvre
  useEffect(() => {
    if (displayId) {
      loadMediaInfo(displayId);
    }
  }, [displayId, loadMediaInfo]);
  
  if (!displayId) return null;
  
  // Utiliser les infos externes si fournies, sinon utiliser nos infos internes
  const displayInfo = externalMediaInfoMap?.get(displayId) || getMediaInfo(displayId);
  const loading = isLoading(displayId);
  const error = getError(displayId);
  
  const isMultiSelection = selectedIds.length > 1;

  return (
    <div className="w-full p-1 max-w-full pointer-events-auto">
      <Card className="w-full bg-background/95 backdrop-blur-sm shadow-lg border border-border p-2 rounded-lg max-w-full z-[200]">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-medium flex items-center gap-1">
            {isMultiSelection ? (
              <>Selected <span className="font-bold">{selectedIds.length}</span> items</>
            ) : (
              <>Media Info</>
            )}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-6 w-6"
            aria-label="Close panel"
          >
            <X size={14} />
          </Button>
        </div>
        
        <ScrollArea className="max-h-[120px] w-full">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
          
          {error && <p className="text-sm text-destructive">Failed to load media info</p>}
          
          {displayInfo && !isMultiSelection && (
            <div className="space-y-1.5 w-full">
              <div className="w-full">
                <span className="text-[10px] text-muted-foreground block">Filename</span>
                <div className="overflow-x-auto">
                  <span className="text-xs whitespace-nowrap block">{displayInfo.alt}</span>
                </div>
              </div>
              
              {displayInfo.createdAt && (
                <div>
                  <span className="text-[10px] text-muted-foreground block">Created</span>
                  <div className="overflow-x-auto">
                    <span className="text-xs whitespace-nowrap">
                      {new Date(displayInfo.createdAt).toLocaleDateString()} 
                      <span className="text-muted-foreground ml-1">
                        ({formatDistanceToNow(new Date(displayInfo.createdAt), { addSuffix: true })})
                      </span>
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-[10px] text-muted-foreground block">Type</span>
                <span className="text-xs">
                  {displayInfo.alt?.toLowerCase().endsWith('.mp4') || 
                  displayInfo.alt?.toLowerCase().endsWith('.mov') 
                    ? 'Video' 
                    : 'Image'}
                </span>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <div className="flex space-x-1 mt-2 justify-center">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onOpenPreview(displayId)}
            className="h-7 w-7"
            title="Preview"
          >
            <Eye size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={onDeleteSelected}
            className="h-7 w-7"
            title="Delete"
          >
            <Trash size={16} className="text-red-500" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => onDownloadSelected(selectedIds)}
            className="h-7 w-7"
            title="Download"
          >
            <Download size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MediaInfoPanel;
