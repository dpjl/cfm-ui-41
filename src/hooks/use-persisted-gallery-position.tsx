
import { useState, useEffect, useCallback } from 'react';
import { throttle } from 'lodash';

/**
 * Hook pour gérer la persistance des positions des galeries dans l'URL et le localStorage
 * Permet de restaurer la position de défilement entre les sessions et de partager des liens
 */
export function usePersistedGalleryPosition() {
  // Récupération initiale des valeurs depuis URL ou localStorage
  const [sourceYearMonth, setSourceYearMonth] = useState<string | null>(() => 
    getFromUrlOrStorage('source-month', 'gallery-source-position'));
  
  const [destYearMonth, setDestYearMonth] = useState<string | null>(() => 
    getFromUrlOrStorage('dest-month', 'gallery-dest-position'));
    
  // Créer des versions throttled des mises à jour pour éviter trop d'écritures lors du défilement
  const throttledSaveToStorageAndUrl = useCallback(
    throttle((value: string | null, urlParam: string, storageKey: string) => {
      saveToStorageAndUrl(value, urlParam, storageKey);
    }, 300),
    []
  );
  
  // Fonction pour mettre à jour la position source
  const updateSourcePosition = useCallback((yearMonth: string | null, immediate = false) => {
    setSourceYearMonth(yearMonth);
    
    if (immediate) {
      saveToStorageAndUrl(yearMonth, 'source-month', 'gallery-source-position');
    } else {
      throttledSaveToStorageAndUrl(yearMonth, 'source-month', 'gallery-source-position');
    }
  }, [throttledSaveToStorageAndUrl]);
  
  // Fonction pour mettre à jour la position destination
  const updateDestPosition = useCallback((yearMonth: string | null, immediate = false) => {
    setDestYearMonth(yearMonth);
    
    if (immediate) {
      saveToStorageAndUrl(yearMonth, 'dest-month', 'gallery-dest-position');
    } else {
      throttledSaveToStorageAndUrl(yearMonth, 'dest-month', 'gallery-dest-position');
    }
  }, [throttledSaveToStorageAndUrl]);
  
  // Mettre à jour depuis l'URL si elle change (par ex. navigation avec boutons du navigateur)
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sourceFromUrl = urlParams.get('source-month');
      const destFromUrl = urlParams.get('dest-month');
      
      if (sourceFromUrl && sourceFromUrl !== sourceYearMonth) {
        setSourceYearMonth(sourceFromUrl);
      }
      
      if (destFromUrl && destFromUrl !== destYearMonth) {
        setDestYearMonth(destFromUrl);
      }
    };
    
    // Écouter les événements popstate pour détecter les changements d'URL (retour/avance navigateur)
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [sourceYearMonth, destYearMonth]);
  
  return {
    sourceYearMonth,
    destYearMonth,
    updateSourcePosition,
    updateDestPosition
  };
}

// Fonctions utilitaires
function getFromUrlOrStorage(urlParam: string, storageKey: string): string | null {
  // Vérifier d'abord l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlValue = urlParams.get(urlParam);
  if (urlValue) return urlValue;
  
  // Ensuite le localStorage
  try {
    const storedValue = localStorage.getItem(storageKey);
    return storedValue ? JSON.parse(storedValue) : null;
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
    return null;
  }
}

function saveToStorageAndUrl(value: string | null, urlParam: string, storageKey: string) {
  // Sauvegarder dans localStorage
  try {
    if (value) {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } else {
      localStorage.removeItem(storageKey);
    }
  } catch (e) {
    console.warn('Error writing to localStorage:', e);
  }
  
  // Mettre à jour l'URL sans créer d'entrée d'historique
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(urlParam, value);
  } else {
    url.searchParams.delete(urlParam);
  }
  window.history.replaceState({}, '', url.toString());
}
