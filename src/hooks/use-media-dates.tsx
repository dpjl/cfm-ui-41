
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MediaListResponse, GalleryItem } from '@/types/gallery';
import { throttle } from 'lodash';

interface MediaDateIndex {
  // Maps ID to date
  idToDate: Map<string, string>;
  // Maps year-month to first index in the array
  yearMonthToIndex: Map<string, number>;
  // Available years in descending order
  years: number[];
  // Available months for each year
  monthsByYear: Map<number, number[]>;
}

// Fonction utilitaire pour formater le label du mois/année
const formatMonthYearLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[month - 1]} ${year}`;
};

export function useMediaDates(mediaListResponse?: MediaListResponse, columnsCount: number = 5) {
  const [currentYearMonth, setCurrentYearMonth] = useState<string | null>(null);
  const [currentYearMonthLabel, setCurrentYearMonthLabel] = useState<string | null>(null);
  const lastScrollPositionRef = useRef<number>(0);
  const throttledUpdateRef = useRef<any>(null);
  const gridColumnsRef = useRef<number>(columnsCount);

  // Mettre à jour la référence du nombre de colonnes lorsqu'il change
  useEffect(() => {
    gridColumnsRef.current = columnsCount;
  }, [columnsCount]);

  // Construire les index à partir des données reçues
  const dateIndex = useMemo(() => {
    if (!mediaListResponse?.mediaIds || !mediaListResponse?.mediaDates) {
      return {
        idToDate: new Map(),
        yearMonthToIndex: new Map(),
        years: [],
        monthsByYear: new Map()
      };
    }

    const { mediaIds, mediaDates } = mediaListResponse;
    const idToDate = new Map<string, string>();
    const yearMonthToIndex = new Map<string, number>();
    const yearMonthSet = new Set<string>();
    const yearSet = new Set<number>();
    const monthsByYear = new Map<number, Set<number>>();

    // Construire les maps et sets
    for (let i = 0; i < mediaIds.length; i++) {
      const id = mediaIds[i];
      const date = mediaDates[i];
      
      if (date) {
        // Mettre en correspondance ID et date
        idToDate.set(id, date);
        
        // Extraire année et mois
        const [year, month] = date.split('-').map(Number);
        
        if (!isNaN(year) && !isNaN(month)) {
          const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
          
          // Enregistrer la première occurrence de cette année-mois
          if (!yearMonthToIndex.has(yearMonth)) {
            yearMonthToIndex.set(yearMonth, i);
          }
          
          // Mémoriser l'année-mois
          yearMonthSet.add(yearMonth);
          
          // Mémoriser l'année
          yearSet.add(year);
          
          // Mémoriser le mois pour cette année
          if (!monthsByYear.has(year)) {
            monthsByYear.set(year, new Set<number>());
          }
          monthsByYear.get(year)?.add(month);
        }
      }
    }

    // Convertir les sets en arrays triés
    const years = Array.from(yearSet).sort((a, b) => b - a); // Tri descendant
    
    const monthsByYearMap = new Map<number, number[]>();
    monthsByYear.forEach((months, year) => {
      monthsByYearMap.set(year, Array.from(months).sort((a, b) => a - b));
    });

    return {
      idToDate,
      yearMonthToIndex,
      years,
      monthsByYear: monthsByYearMap
    };
  }, [mediaListResponse]);

  // Initialiser currentYearMonth avec le mois le plus récent disponible
  useEffect(() => {
    // Si currentYearMonth n'est pas défini et que nous avons des années disponibles
    if (!currentYearMonth && dateIndex.years.length > 0) {
      const mostRecentYear = dateIndex.years[0]; // Les années sont triées par ordre décroissant
      const monthsForYear = dateIndex.monthsByYear.get(mostRecentYear);
      
      if (monthsForYear && monthsForYear.length > 0) {
        // CORRECTION: Prendre le mois le plus récent (dernier du tableau) et non le premier
        const mostRecentMonth = monthsForYear[monthsForYear.length - 1]; 
        const initialYearMonth = `${mostRecentYear}-${mostRecentMonth.toString().padStart(2, '0')}`;
        setCurrentYearMonth(initialYearMonth);
        setCurrentYearMonthLabel(formatMonthYearLabel(initialYearMonth));
      }
    }
  }, [dateIndex, currentYearMonth]);

  // Créer une structure de données enrichie avec des séparateurs de mois/année
  const enrichedGalleryItems = useMemo(() => {
    if (!mediaListResponse?.mediaIds || !mediaListResponse?.mediaDates) {
      return [];
    }

    const { mediaIds, mediaDates } = mediaListResponse;
    const items: GalleryItem[] = [];
    let actualIndex = 0; // Index réel dans la liste finale

    // Fonction pour formatter le label du mois/année (ex: "Janvier 2023")
    const formatMonthYearLabel = (yearMonth: string): string => {
      const [year, month] = yearMonth.split('-').map(Number);
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      return `${monthNames[month - 1]} ${year}`;
    };

    // Premier passage : collecte des médias groupés par mois/année
    const mediaByYearMonth = new Map<string, { id: string, index: number, date: string }[]>();
    
    for (let i = 0; i < mediaIds.length; i++) {
      const id = mediaIds[i];
      const date = mediaDates[i];
      
      if (date) {
        const [year, month] = date.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month)) {
          const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
          
          if (!mediaByYearMonth.has(yearMonth)) {
            mediaByYearMonth.set(yearMonth, []);
          }
          
          mediaByYearMonth.get(yearMonth)!.push({ id, index: i, date });
        }
      }
    }
    
    // Deuxième passage : création de la liste finale avec séparateurs
    // Tri des year-months dans l'ordre chronologique inverse
    const sortedYearMonths = Array.from(mediaByYearMonth.keys()).sort((a, b) => b.localeCompare(a));
    
    // Pour chaque mois/année
    for (const yearMonth of sortedYearMonths) {
      // Vérifier si nous sommes au début d'une ligne (dans une grille virtuelle)
      // Si nous ne sommes pas au début d'une ligne, ajouter des éléments vides pour compléter la ligne
      // Utiliser le paramètre columnsCount au lieu de la valeur codée en dur
      const isStartOfRow = items.length % gridColumnsRef.current === 0;
      
      if (!isStartOfRow) {
        // Calculer combien d'éléments vides nous devons ajouter pour atteindre le début de la ligne suivante
        // Utiliser columnsCount au lieu de la valeur codée en dur
        const itemsToAdd = gridColumnsRef.current - (items.length % gridColumnsRef.current);
        for (let i = 0; i < itemsToAdd; i++) {
          // Ajouter un élément vide explicite qui ne déclenchera pas de requêtes
          items.push({
            type: 'media',
            id: `empty-${yearMonth}-${i}`,  // Amélioration: ID plus spécifique pour debug
            index: -1,          // Index original invalide
            actualIndex: actualIndex         // Index réel tenant compte des séparateurs
          });
          actualIndex++;
        }
      }
      
      // Maintenant nous sommes sûrs d'être au début d'une ligne
      // Ajouter un séparateur pour ce mois/année
      items.push({
        type: 'separator',
        yearMonth,
        label: formatMonthYearLabel(yearMonth),
        index: actualIndex
      });
      actualIndex++;
      
      // Ajouter tous les médias de ce mois/année
      const mediaItems = mediaByYearMonth.get(yearMonth)!;
      for (const { id, index } of mediaItems) {
        items.push({
          type: 'media',
          id,
          index,          // Index original dans mediaIds
          actualIndex     // Index réel tenant compte des séparateurs
        });
        actualIndex++;
      }
    }

    return items;
  }, [mediaListResponse, gridColumnsRef.current]); // Ajout de gridColumnsRef.current comme dépendance

  // Créer un index optimisé des séparateurs pour une recherche efficace
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

  // Index pour accéder rapidement à un séparateur par yearMonth
  const separatorIndices = useMemo(() => {
    const indices = new Map<string, number>();
    enrichedGalleryItems.forEach((item, index) => {
      if (item.type === 'separator') {
        indices.set(item.yearMonth, index);
      }
    });
    return indices;
  }, [enrichedGalleryItems]);

  // Nouvelle fonction optimisée: calculer le mois-année à partir d'une position de défilement
  const getYearMonthFromScrollPosition = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    if (!gridRef.current || sortedSeparatorPositions.length === 0) return null;
    
    const rowHeight = gridRef.current.props.rowHeight;
    const columnCount = gridRef.current.props.columnCount;
    
    // Calculer l'index de la première ligne visible
    const visibleRowIndex = Math.floor(scrollTop / rowHeight);
    
    // Calculer l'index du premier élément de cette ligne
    const firstVisibleItemIndex = visibleRowIndex * columnCount;
    
    // Cas spécial: vérifier si un séparateur est exactement sur la première ligne visible
    const exactMatchIndex = sortedSeparatorPositions.findIndex(
      sep => sep.index >= firstVisibleItemIndex && sep.index < firstVisibleItemIndex + columnCount
    );
    
    if (exactMatchIndex >= 0) {
      // Un séparateur est présent sur la première ligne visible
      return sortedSeparatorPositions[exactMatchIndex].yearMonth;
    }
    
    // Sinon, recherche binaire pour trouver le dernier séparateur avant le premier élément visible
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

  // Mise à jour du mois-année courant lors du défilement
  useEffect(() => {
    // Créer une fonction throttle pour éviter trop de mises à jour
    if (!throttledUpdateRef.current) {
      throttledUpdateRef.current = throttle((scrollTop: number, gridRef: React.RefObject<any>) => {
        // Obtenir le nouveau mois-année
        const newYearMonth = getYearMonthFromScrollPosition(scrollTop, gridRef);
        
        // Mettre à jour l'état si nécessaire
        if (newYearMonth && newYearMonth !== currentYearMonth) {
          setCurrentYearMonth(newYearMonth);
          setCurrentYearMonthLabel(formatMonthYearLabel(newYearMonth));
        }
      }, 100);
    }
  }, [getYearMonthFromScrollPosition, currentYearMonth]);

  // Fonctions pour la navigation par date
  const scrollToYearMonth = useCallback((year: number, month: number, gridRef: React.RefObject<any>) => {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Essayer d'abord avec l'index du séparateur (si disponible)
    const separatorIndex = separatorIndices.get(yearMonth);
    if (separatorIndex !== undefined && gridRef.current) {
      const rowIndex = Math.floor(separatorIndex / gridRef.current.props.columnCount);
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex
      });
      setCurrentYearMonth(yearMonth);
      setCurrentYearMonthLabel(formatMonthYearLabel(yearMonth));
      return true;
    }
    
    // Sinon, utiliser l'ancienne méthode avec yearMonthToIndex
    const mediaIndex = dateIndex.yearMonthToIndex.get(yearMonth);
    if (mediaIndex !== undefined && gridRef.current) {
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex: Math.floor(mediaIndex / gridRef.current.props.columnCount)
      });
      setCurrentYearMonth(yearMonth);
      setCurrentYearMonthLabel(formatMonthYearLabel(yearMonth));
      return true;
    }
    
    return false;
  }, [dateIndex, separatorIndices]);

  // Fonction pour mettre à jour le mois courant lors d'un défilement
  const updateCurrentYearMonthFromScroll = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    if (throttledUpdateRef.current) {
      throttledUpdateRef.current(scrollTop, gridRef);
    }
  }, []);

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
    navigateToNextMonth
  };
}
