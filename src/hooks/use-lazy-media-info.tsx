
import { useState, useCallback, useRef } from 'react';
import { fetchMediaInfo, DetailedMediaInfo } from '@/api/imageApi';
import { useMediaCache } from './use-media-cache';

/**
 * Hook pour charger les informations média à la demande uniquement
 * Contrairement à useMediaInfo, ne charge pas automatiquement lorsque visible
 */
export const useLazyMediaInfo = (position: 'source' | 'destination' = 'source') => {
  const [mediaInfo, setMediaInfo] = useState<Map<string, DetailedMediaInfo | null>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  const { getCachedMediaInfo, setCachedMediaInfo } = useMediaCache();
  const requestsInProgressRef = useRef<Set<string>>(new Set());

  // Fonction pour charger les informations d'un média spécifique
  const loadMediaInfo = useCallback(async (id: string) => {
    // Si l'ID est déjà en cours de chargement, ne pas lancer une autre requête
    if (requestsInProgressRef.current.has(id)) {
      return;
    }

    // Vérifier si nous avons déjà les informations en cache local
    if (mediaInfo.has(id)) {
      return;
    }

    // Vérifier d'abord le cache global
    const cachedInfo = getCachedMediaInfo(id, position);
    if (cachedInfo) {
      setMediaInfo(prev => {
        const newMap = new Map(prev);
        newMap.set(id, cachedInfo);
        return newMap;
      });
      return;
    }

    // Marquer l'ID comme en cours de chargement
    requestsInProgressRef.current.add(id);
    setLoading(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    try {
      // S'il s'agit d'un ID fictif, créer des données fictives au lieu de récupérer
      if (id.startsWith('mock-media-')) {
        const mockInfo: DetailedMediaInfo = {
          alt: `Mock Media ${id}`,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          name: `file_${id}.jpg`,
          path: `/media/photos/file_${id}.jpg`,
          size: `${Math.floor(Math.random() * 10000) + 500}KB`,
          cameraModel: ["iPhone 13 Pro", "Canon EOS 5D", "Sony Alpha A7III", "Nikon Z6"][Math.floor(Math.random() * 4)],
          hash: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          duplicatesCount: Math.floor(Math.random() * 3)
        };
        
        setMediaInfo(prev => {
          const newMap = new Map(prev);
          newMap.set(id, mockInfo);
          return newMap;
        });
        
        // Mettre en cache les informations fictives
        setCachedMediaInfo(id, position, mockInfo);
      } else {
        const data = await fetchMediaInfo(id, position);
        
        setMediaInfo(prev => {
          const newMap = new Map(prev);
          newMap.set(id, data);
          return newMap;
        });
        
        // Mettre en cache les informations récupérées
        setCachedMediaInfo(id, position, data);
      }
      
      // Supprimer les erreurs précédentes si elles existent
      if (errors.has(id)) {
        setErrors(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    } catch (err) {
      console.error(`Error fetching info for media ${id}:`, err);
      
      setErrors(prev => {
        const newMap = new Map(prev);
        newMap.set(id, err instanceof Error ? err : new Error('Unknown error'));
        return newMap;
      });
      
      // Définir des informations de secours avec l'ID
      const fallbackInfo = { 
        alt: `Media ${id}`, 
        createdAt: null
      } as DetailedMediaInfo;
      
      setMediaInfo(prev => {
        const newMap = new Map(prev);
        newMap.set(id, fallbackInfo);
        return newMap;
      });
      
      // Mettre en cache même les informations de secours pour éviter les nouvelles tentatives
      setCachedMediaInfo(id, position, fallbackInfo);
    } finally {
      // Marquer le chargement comme terminé
      requestsInProgressRef.current.delete(id);
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [mediaInfo, errors, getCachedMediaInfo, setCachedMediaInfo, position]);

  // Fonction pour charger plusieurs médias à la fois
  const loadMediaInfoBatch = useCallback((ids: string[]) => {
    ids.forEach(id => loadMediaInfo(id));
  }, [loadMediaInfo]);

  // Obtenir les informations d'un média spécifique
  const getMediaInfo = useCallback((id: string) => {
    return mediaInfo.get(id) || null;
  }, [mediaInfo]);

  // Vérifier si un média est en cours de chargement
  const isLoading = useCallback((id: string) => {
    return loading.has(id);
  }, [loading]);

  // Obtenir l'erreur pour un média spécifique
  const getError = useCallback((id: string) => {
    return errors.get(id) || null;
  }, [errors]);

  return {
    loadMediaInfo,
    loadMediaInfoBatch,
    getMediaInfo,
    isLoading,
    getError,
    mediaInfoMap: mediaInfo
  };
};
