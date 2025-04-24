import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Image, Video } from 'lucide-react';
import { Button } from './ui/button';
import { useLazyMediaInfo } from '@/hooks/use-lazy-media-info';
import { useIsMobile } from '@/hooks/use-breakpoint';

interface MediaPreviewProps {
  mediaId: string;
  isVideo?: boolean;
  alt?: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  position?: 'source' | 'destination';
  mediaByDate?: { [key: string]: string[] };
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaId,
  isVideo = false,
  alt = 'Media preview',
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  position = 'source',
  mediaByDate = {}
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const isMobile = useIsMobile();

  // Flatten all media IDs from mediaByDate
  const allMediaIds = Object.values(mediaByDate).flat();
  const currentIndex = allMediaIds.indexOf(mediaId);
  const totalMedia = allMediaIds.length;

  // Utiliser notre hook pour charger les infos au besoin
  const { loadMediaInfo, getMediaInfo } = useLazyMediaInfo(position);
  
  // Charger les infos du média ouvert dans la prévisualisation
  useEffect(() => {
    loadMediaInfo(mediaId);
  }, [mediaId, loadMediaInfo]);
  
  // Récupérer les infos pour l'attribut alt
  const mediaInfo = getMediaInfo(mediaId);
  const mediaAlt = mediaInfo?.alt || alt;
  const mediaDate = mediaInfo?.createdAt ? new Date(mediaInfo.createdAt).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  // Mise à jour pour inclure le paramètre "directory" dans l'URL
  const mediaUrl = `${apiBaseUrl}/media?id=${mediaId}&directory=${position}`;

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [mediaId]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    console.error(`Failed to load media with ID: ${mediaId}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && onNext) onNext();
      else if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X size={24} />
        </Button>
      </div>

      <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4">
        {/* Bouton précédent */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className={`absolute left-4 z-10 text-white hover:bg-white/20 ${
            isMobile ? 'h-16 w-16' : 'h-12 w-12'
          }`}
          aria-label="Previous media"
          disabled={!hasPrevious}
        >
          <ChevronLeft size={isMobile ? 32 : 24} />
        </Button>

        <div className="relative w-full h-full flex items-center justify-center">
          {isVideo ? (
            <video
              ref={videoRef}
              src={mediaUrl}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              controls
              autoPlay
              onLoadedData={handleLoad}
              onError={handleError}
              playsInline
            />
          ) : (
            <img
              src={mediaUrl}
              alt={mediaAlt}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {!loaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="text-red-400 mb-2">
                {isVideo ? <Video size={48} /> : <Image size={48} />}
              </div>
              <p>Failed to load media</p>
            </div>
          )}
        </div>

        {/* Bouton suivant */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className={`absolute right-4 z-10 text-white hover:bg-white/20 ${
            isMobile ? 'h-16 w-16' : 'h-12 w-12'
          }`}
          aria-label="Next media"
          disabled={!hasNext}
        >
          <ChevronRight size={isMobile ? 32 : 24} />
        </Button>

        {/* Indicateur de position et date */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm flex flex-col items-center">
            <div className="font-medium">
              {currentIndex + 1} / {totalMedia}
            </div>
            {mediaDate && (
              <div className="text-xs text-white/80 mt-1">
                {mediaDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
