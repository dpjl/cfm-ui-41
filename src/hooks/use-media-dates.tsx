import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { usePositionRestoration } from './use-position-restoration';
import type { FixedSizeGrid } from 'react-window';
import { MediaIdsByDate, GalleryItem } from '@/types/gallery';
import { throttle } from 'lodash';
import { useLanguage } from '@/hooks/use-language';

// On utilise GalleryItem au lieu de EnrichedGalleryItem qui n'existe pas
type EnrichedGalleryItem = GalleryItem;

interface MediaDateIndex {
  // Maps ID to date
  idToDate: Map<string, string>;
  // Maps year-month to first index in the array
  yearMonthToIndex: Map<string, number>;
  // Available years in descending order
  years: number[];
  // Available months for each year
  monthsByYear: Map<number, number[]>;
  // Maps year-month to first index in the union array
  yearMonthToUnionIndex: Map<string, number>;
}

// Fonction utilitaire pour formater le label du mois/année
const formatMonthYearLabel = (yearMonth: string, t: (key: string) => string): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  const monthKeys = [
    'month_january', 'month_february', 'month_march', 'month_april',
    'month_may', 'month_june', 'month_july', 'month_august',
    'month_september', 'month_october', 'month_november', 'month_december'
  ];
  return `${t(monthKeys[month - 1])} ${year}`;
};

// Fonction utilitaire pour extraire le group_id
const extractGroupId = (id: string): number => {
  const cleanId = id.startsWith('v') ? id.slice(1) : id;
  return parseInt(cleanId.split('.')[0]);
};

export function useMediaDates(
  mediaByDate: MediaIdsByDate | undefined,
  columnsCount: number,
  position: 'source' | 'destination',
  persistedYearMonth?: string | null,
  onYearMonthChange?: (yearMonth: string | null, immediate?: boolean) => void,
  isSyncMode?: boolean,
  unionData?: MediaIdsByDate
) {
  const [currentYearMonth, setCurrentYearMonth] = useState<string | null>(null);
  const [currentYearMonthLabel, setCurrentYearMonthLabel] = useState<string | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const throttledUpdateRef = useRef<any>(null);
  const externalGridRefRef = useRef<React.RefObject<any> | null>(null);
  const dateToSortedIdsRef = useRef<Map<string, string[]>>(new Map());
  const performanceRef = useRef<{
    dateIndex: number;
    enrichedItems: number;
    total: number;
  }>({ dateIndex: 0, enrichedItems: 0, total: 0 });
  
  // Référence pour indiquer si la modification vient d'une action manuelle (clic sur date)
  const isManualChangeRef = useRef<boolean>(false);

  const { t } = useLanguage();

  // Méthode pour sauvegarder la référence externe de la grille
  const setExternalGridRef = useCallback((ref: React.RefObject<any> | null) => {
    externalGridRefRef.current = ref;
  }, []);

  // Construire les index à partir des données reçues
  const dateIndex = useMemo(() => {
    const startTime = performance.now();
    
    if (!mediaByDate) {
      return {
        idToDate: new Map(),
        yearMonthToIndex: new Map(),
        years: [],
        monthsByYear: new Map(),
        yearMonthToUnionIndex: new Map()
      };
    }

    const idToDate = new Map<string, string>();
    const yearMonthToIndex = new Map<string, number>();
    const yearSet = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();
    let index = 0;

    // Trier les dates du plus récent au plus ancien
    const sortedDates = Object.keys(mediaByDate).sort((a, b) => b.localeCompare(a));
    
    for (const date of sortedDates) {
      const [year, month] = date.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month)) {
        yearSet.add(year);
        if (!monthsByYear.has(year)) monthsByYear.set(year, new Set<number>());
        monthsByYear.get(year)?.add(month);
        const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
        if (!yearMonthToIndex.has(yearMonth)) yearMonthToIndex.set(yearMonth, index);
        for (const id of mediaByDate[date]) {
          idToDate.set(id, date);
          index++;
        }
      }
    }

    // Calcul de yearMonthToUnionIndex si en mode synchronisé
    const yearMonthToUnionIndex = new Map<string, number>();
    if (isSyncMode && unionData) {
      let unionIndex = 0;
      const allDates = new Set([...Object.keys(mediaByDate), ...Object.keys(unionData)]);
      const sortedUnionDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
      
      // Pré-calculer les group_id pour tous les IDs
      const idToGroupId = new Map<string, number>();
      const allIds = new Set<string>();
      
      // Première passe : collecter tous les IDs uniques et leurs group_id
      for (const date of sortedUnionDates) {
        const ids = [...(mediaByDate[date] || []), ...(unionData[date] || [])];
        for (const id of ids) {
          if (!idToGroupId.has(id)) {
            idToGroupId.set(id, extractGroupId(id));
            allIds.add(id);
          }
        }
      }
      
      // Deuxième passe : organiser les IDs par date et les trier
      const dateToSortedIds = new Map<string, string[]>();
      for (const date of sortedUnionDates) {
        const [year, month] = date.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month)) {
          const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
          if (!yearMonthToUnionIndex.has(yearMonth)) {
            yearMonthToUnionIndex.set(yearMonth, unionIndex);
          }
          
          // Récupérer tous les IDs pour cette date
          const dateIds = new Set([
            ...(mediaByDate[date] || []),
            ...(unionData[date] || [])
          ]);
          
          // Trier les IDs en utilisant les group_id pré-calculés
          const sortedIds = Array.from(dateIds).sort((a, b) => 
            (idToGroupId.get(a) || 0) - (idToGroupId.get(b) || 0)
          );
          
          dateToSortedIds.set(date, sortedIds);
          unionIndex += sortedIds.length;
        }
      }
      
      // Sauvegarder les IDs triés dans la référence
      dateToSortedIdsRef.current = dateToSortedIds;
    }

    const years = Array.from(yearSet).sort((a, b) => b - a);
    const monthsByYearMap = new Map<number, number[]>();
    monthsByYear.forEach((months, year) => {
      monthsByYearMap.set(year, Array.from(months).sort((a, b) => a - b));
    });

    const endTime = performance.now();
    performanceRef.current.dateIndex = endTime - startTime;

    return {
      idToDate,
      yearMonthToIndex,
      years,
      monthsByYear: monthsByYearMap,
      yearMonthToUnionIndex
    };
  }, [mediaByDate, isSyncMode, unionData]);

  // Premier useMemo pour créer enrichedGalleryItems
  const enrichedGalleryItems = useMemo(() => {
    const startTime = performance.now();
    
    if (!mediaByDate) return [];
    
    // Création de monthToIds pour le mode normal
    const monthToIds = new Map<string, string[]>();
    if (!isSyncMode) {
      for (const date of Object.keys(mediaByDate)) {
        const [year, month] = date.split('-');
        if (!year || !month) continue;
        const yearMonth = `${year}-${month}`;
        if (!monthToIds.has(yearMonth)) monthToIds.set(yearMonth, []);
        monthToIds.get(yearMonth)!.push(...mediaByDate[date]);
      }
    }

    // Création de monthToUnionIds pour le mode synchronisé
    const monthToUnionIds = new Map<string, string[]>();
    if (isSyncMode && unionData) {
      // Utiliser les IDs triés pré-calculés
      for (const [date, sortedIds] of dateToSortedIdsRef.current.entries()) {
        const [year, month] = date.split('-');
        if (!year || !month) continue;
        const yearMonth = `${year}-${month}`;
        monthToUnionIds.set(yearMonth, sortedIds);
      }
    }

    // Utilisation de la source de données appropriée
    const sourceData = isSyncMode ? monthToUnionIds : monthToIds;
    if (!sourceData) return [];

    // Génération des GalleryItem
    const items: GalleryItem[] = [];
    let actualIndex = 0;
    const sortedYearMonths = Array.from(sourceData.keys()).sort((a, b) => b.localeCompare(a));

    for (const yearMonth of sortedYearMonths) {
      // Saut de ligne si besoin
      const isStartOfRow = items.length % columnsCount === 0;
      if (!isStartOfRow) {
        const itemsToAdd = columnsCount - (items.length % columnsCount);
        for (let i = 0; i < itemsToAdd; i++) {
          items.push({ type: 'media', id: `empty-${yearMonth}-${i}`, index: -1, actualIndex });
          actualIndex++;
        }
      }

      // Séparateur mensuel
      items.push({ 
        type: 'separator', 
        yearMonth, 
        label: formatMonthYearLabel(yearMonth, t), 
        index: actualIndex, 
        actualIndex 
      });
      actualIndex++;

      // Médias du mois
      const ids = sourceData.get(yearMonth)!;
      for (const id of ids) {
        // En mode synchronisé, vérifier si l'ID est présent dans la galerie actuelle
        if (isSyncMode) {
          // Utiliser idToDate pour une recherche O(1) au lieu de O(n)
          const isPresent = dateIndex.idToDate.has(id);
          items.push({
            type: isPresent ? 'media' : 'missing',
            id,
            index: actualIndex,
            actualIndex
          });
        } else {
          items.push({ type: 'media', id, index: actualIndex, actualIndex });
        }
        actualIndex++;
      }
    }

    const endTime = performance.now();
    performanceRef.current.enrichedItems = endTime - startTime;
    performanceRef.current.total = performanceRef.current.dateIndex + performanceRef.current.enrichedItems;

    // Log des performances
    console.log(`[Performance] Mode synchronisé: ${isSyncMode ? 'ON' : 'OFF'}`);
    console.log(`[Performance] dateIndex: ${performanceRef.current.dateIndex.toFixed(2)}ms`);
    console.log(`[Performance] enrichedItems: ${performanceRef.current.enrichedItems.toFixed(2)}ms`);
    console.log(`[Performance] Total: ${performanceRef.current.total.toFixed(2)}ms`);

    return items;
  }, [mediaByDate, columnsCount, isSyncMode, unionData, t]);

  // Créer un index optimisé des séparateurs APRÈS avoir créé enrichedGalleryItems
  const sortedSeparatorPositions = useMemo(() => {
    const positions: {index: number, yearMonth: string}[] = [];
    
    enrichedGalleryItems.forEach((item) => {
      if (item.type === 'separator') {
        positions.push({index: item.index, yearMonth: item.yearMonth});
      }
    });
    
    // Tri par index croissant
    return positions.sort((a, b) => a.index - b.index);
  }, [enrichedGalleryItems]);

  // Create separator indices BEFORE using it in the callback
  const separatorIndices = useMemo(() => {
    const indices = new Map<string, number>();
    enrichedGalleryItems.forEach((item, index) => {
      if (item.type === 'separator') {
        indices.set(item.yearMonth, index);
      }
    });
    return indices;
  }, [enrichedGalleryItems]);

  // Initialiser currentYearMonth avec le mois le plus récent disponible
  useEffect(() => {
    if (!currentYearMonth && dateIndex.years.length > 0) {
      const mostRecentYear = dateIndex.years[0]; // Les années sont triées par ordre décroissant
      const monthsForYear = dateIndex.monthsByYear.get(mostRecentYear);
      
      if (monthsForYear && monthsForYear.length > 0) {
        const mostRecentMonth = monthsForYear[monthsForYear.length - 1]; 
        const initialYearMonth = `${mostRecentYear}-${mostRecentMonth.toString().padStart(2, '0')}`;
        setCurrentYearMonth(initialYearMonth);
        setCurrentYearMonthLabel(formatMonthYearLabel(initialYearMonth, t));
      }
    }
  }, [dateIndex, currentYearMonth, t]);

  // Fonction pour faire défiler vers une année-mois spécifique
  const scrollToYearMonth = useCallback((year: number, month: number, gridRef: React.RefObject<any> | null) => {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Indiquer que c'est un changement manuel pour une mise à jour immédiate
    isManualChangeRef.current = true;
    
    // Mise à jour directe des états pour éviter le décalage
    setCurrentYearMonth(yearMonth);
    setCurrentYearMonthLabel(formatMonthYearLabel(yearMonth, t));
    
    // Si aucun gridRef n'est fourni, essayer d'utiliser la référence externe sauvegardée
    if (!gridRef && externalGridRefRef.current) {
      gridRef = externalGridRefRef.current;
    }
    
    // Si toujours pas de gridRef valide, on ne fait que mettre à jour les états
    if (!gridRef?.current) return true;
    
    // Essayer d'abord avec l'index du séparateur (si disponible)
    const separatorIndex = separatorIndices.get(yearMonth);
    if (separatorIndex !== undefined && gridRef.current) {
      const rowIndex = Math.floor(separatorIndex / gridRef.current.props.columnCount);
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex
      });
      return true;
    }
    
    // Sinon, utiliser l'ancienne méthode avec yearMonthToIndex
    const mediaIndex = dateIndex.yearMonthToIndex.get(yearMonth);
    if (mediaIndex !== undefined && gridRef.current) {
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex: Math.floor(mediaIndex / gridRef.current.props.columnCount)
      });
      return true;
    }
    
    return false;
  }, [dateIndex.yearMonthToIndex, separatorIndices, t]);

  // Nouvelle fonction optimisée: calculer le mois-année à partir d'une position de défilement
  const getYearMonthFromScrollPosition = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    if (!gridRef.current || sortedSeparatorPositions.length === 0) return null;

    // Ajout d'un offset pour rendre la détection moins sensible
    const SCROLL_OFFSET = 32; // pixels, à ajuster si besoin
    const rowHeight = gridRef.current.props.rowHeight;
    const columnCount = gridRef.current.props.columnCount;

    // Calculer l'index de la première ligne visible avec offset
    const visibleRowIndex = Math.floor((scrollTop + SCROLL_OFFSET) / rowHeight);

    // Calculer l'index du premier élément de cette ligne
    const firstVisibleItemIndex = visibleRowIndex * columnCount;

    // Recherche binaire pour trouver le dernier séparateur avant le premier élément visible
    let left = 0;
    let right = sortedSeparatorPositions.length - 1;
    let result = null;

    // Si nous sommes avant le premier séparateur
    if (firstVisibleItemIndex < sortedSeparatorPositions[0].index) {
      return null;
    }

    // Recherche binaire pour trouver le séparateur précédant le premier élément visible
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (sortedSeparatorPositions[mid].index <= firstVisibleItemIndex) {
        // Ce séparateur est un candidat potentiel
        result = sortedSeparatorPositions[mid].yearMonth;
        // Chercher plus loin à droite pour un meilleur candidat
        left = mid + 1;
      } else {
        // Ce séparateur est après notre position, chercher à gauche
        right = mid - 1;
      }
    }

    return result;
  }, [sortedSeparatorPositions]);

  // Utiliser le nouveau système de restauration de position
  const { isRestoring, restoreToPosition } = usePositionRestoration({
    gridRef: externalGridRefRef.current,
    currentYearMonth,
    onScrollToYearMonth: scrollToYearMonth,
    persistedYearMonth,
    onUpdateYearMonth: onYearMonthChange,
    position,
    columnsCount
  });

  // Mise à jour du mois-année courant lors du défilement
  useEffect(() => {
    // Nettoyer l'ancienne fonction throttle si elle existe
    const oldThrottledUpdate = throttledUpdateRef.current;
    
    // Créer une nouvelle fonction throttle avec les dépendances à jour
    throttledUpdateRef.current = throttle((scrollTop: number, gridRef: React.RefObject<any>) => {
      // Ne pas mettre à jour si une restauration est en cours
      if (isRestoring) {
        console.log(`[${position}] Scroll update skipped: restoration in progress`);
        return;
      }
      
      // Obtenir le nouveau mois-année
      const newYearMonth = getYearMonthFromScrollPosition(scrollTop, gridRef);
      
      // Mettre à jour l'état si nécessaire
      if (newYearMonth && newYearMonth !== currentYearMonth) {
        setCurrentYearMonth(newYearMonth);
        setCurrentYearMonthLabel(formatMonthYearLabel(newYearMonth, t));
        
        // Notifier le parent du changement (sans mise à jour immédiate)
        if (onYearMonthChange) {
          onYearMonthChange(newYearMonth, false);
        }
      }
    }, 100);
    
    // Fonction de nettoyage pour annuler la fonction throttle précédente
    return () => {
      if (oldThrottledUpdate && typeof oldThrottledUpdate.cancel === 'function') {
        oldThrottledUpdate.cancel();
      }
    };
  }, [getYearMonthFromScrollPosition, currentYearMonth, isRestoring, position, onYearMonthChange, t]);

  // Fonction pour mettre à jour le mois courant lors d'un défilement
  const updateCurrentYearMonthFromScroll = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    // Ne pas mettre à jour si une restauration est en cours
    if (isRestoring) {
      return;
    }
    
    // Sauvegarder la référence externe de la grille pour les repositionnements futurs
    if (gridRef && !externalGridRefRef.current) {
      externalGridRefRef.current = gridRef;
    }
    
    // Sauvegarder la position de défilement pour référence
    lastScrollPositionRef.current = scrollTop;
    
    if (throttledUpdateRef.current) {
      throttledUpdateRef.current(scrollTop, gridRef);
    }
  }, [isRestoring]);

  // MODIFICATION: Naviguer au mois suivant chronologiquement (plus récent)
  const navigateToPreviousMonth = useCallback((gridRef: React.RefObject<any>) => {
    if (!currentYearMonth || !gridRef.current) return false;
    
    // Obtenir tous les yearMonth disponibles triés chronologiquement (du plus récent au plus ancien)
    const allYearMonths = Array.from(dateIndex.yearMonthToIndex.keys()).sort((a, b) => b.localeCompare(a));
    
    // Trouver l'index de l'année-mois actuel
    const currentIndex = allYearMonths.indexOf(currentYearMonth);
    
    if (currentIndex < allYearMonths.length - 1) {
      // CORRECTION: Aller au mois plus ancien (next dans l'ordre de tri mais previous chronologiquement)
      const nextYearMonth = allYearMonths[currentIndex + 1];
      const [nextYear, nextMonth] = nextYearMonth.split('-').map(Number);
      
      return scrollToYearMonth(nextYear, nextMonth, gridRef);
    }
    
    return false;
  }, [currentYearMonth, dateIndex.yearMonthToIndex, scrollToYearMonth]);

  // MODIFICATION: Naviguer au mois précédent chronologiquement (plus ancien)
  const navigateToNextMonth = useCallback((gridRef: React.RefObject<any>) => {
    if (!currentYearMonth || !gridRef.current) return false;
    
    // Obtenir tous les yearMonth disponibles triés chronologiquement (du plus récent au plus ancien)
    const allYearMonths = Array.from(dateIndex.yearMonthToIndex.keys()).sort((a, b) => b.localeCompare(a));
    
    // Trouver l'index de l'année-mois actuel
    const currentIndex = allYearMonths.indexOf(currentYearMonth);
    
    if (currentIndex > 0) {
      // CORRECTION: Aller au mois plus récent (previous dans l'ordre de tri mais next chronologiquement)
      const previousYearMonth = allYearMonths[currentIndex - 1];
      const [prevYear, prevMonth] = previousYearMonth.split('-').map(Number);
      
      return scrollToYearMonth(prevYear, prevMonth, gridRef);
    }
    
    return false;
  }, [currentYearMonth, dateIndex.yearMonthToIndex, scrollToYearMonth]);

  const getDateForId = useCallback((id: string): string | undefined => {
    return dateIndex.idToDate.get(id);
  }, [dateIndex]);

  return {
    dateIndex,
    currentYearMonth,
    currentYearMonthLabel,
    scrollToYearMonth,
    getDateForId,
    setCurrentYearMonth,
    enrichedGalleryItems,
    separatorIndices,
    updateCurrentYearMonthFromScroll,
    navigateToPreviousMonth,
    navigateToNextMonth,
    setExternalGridRef
  };
}
