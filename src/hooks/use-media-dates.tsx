
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
  
  // Nouvel état pour désactiver temporairement les mises à jour basées sur le défilement
  const isRepositioningRef = useRef<boolean>(false);
  // Mémoriser le mois courant pour le repositionnement après changement de colonnes
  const lastYearMonthRef = useRef<string | null>(null);
  // Référence à la grille externe pour le repositionnement
  const externalGridRefRef = useRef<React.RefObject<any> | null>(null);

  // Logs pour debugging
  const logsEnabledRef = useRef<boolean>(true);
  const debugLog = useCallback((message: string, data?: any) => {
    if (logsEnabledRef.current) {
      if (data) {
        console.log(`[useMediaDates] ${message}`, data);
      } else {
        console.log(`[useMediaDates] ${message}`);
      }
    }
  }, []);

  // Méthode pour sauvegarder la référence externe de la grille
  const setExternalGridRef = useCallback((ref: React.RefObject<any> | null) => {
    debugLog(`setExternalGridRef called, previous ref: ${externalGridRefRef.current ? 'exists' : 'null'}, new ref: ${ref ? 'exists' : 'null'}`);
    externalGridRefRef.current = ref;
    
    // Ajout de logs pour les propriétés de la grille
    if (ref?.current) {
      const gridProps = {
        columnCount: ref.current.props?.columnCount,
        rowHeight: ref.current.props?.rowHeight,
        rowCount: ref.current.props?.rowCount,
        width: ref.current.props?.width,
        height: ref.current.props?.height
      };
      debugLog('Grid properties:', gridProps);
    }
  }, [debugLog]);

  // Construire les index à partir des données reçues
  const dateIndex = useMemo(() => {
    debugLog(`Building dateIndex, mediaListResponse exists: ${!!mediaListResponse}, mediaIds length: ${mediaListResponse?.mediaIds?.length || 0}`);
    
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

    const result = {
      idToDate,
      yearMonthToIndex,
      years,
      monthsByYear: monthsByYearMap
    };
    
    debugLog(`dateIndex built with ${years.length} years, yearMonthToIndex size: ${yearMonthToIndex.size}`);
    
    return result;
  }, [mediaListResponse, debugLog]);

  // IMPORTANT: Define scrollToYearMonth function before it's used in useEffect or other functions
  const scrollToYearMonth = useCallback((year: number, month: number, gridRef: React.RefObject<any> | null) => {
    const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    debugLog(`scrollToYearMonth called: ${yearMonth}`);
    
    // Mise à jour directe des états pour éviter le décalage
    setCurrentYearMonth(yearMonth);
    setCurrentYearMonthLabel(formatMonthYearLabel(yearMonth));
    
    // Si aucun gridRef n'est fourni, essayer d'utiliser la référence externe sauvegardée
    if (!gridRef && externalGridRefRef.current) {
      gridRef = externalGridRefRef.current;
      debugLog('Using saved external grid reference');
    }
    
    // Si toujours pas de gridRef valide, on ne fait que mettre à jour les états
    if (!gridRef?.current) {
      debugLog('No valid grid reference available for scrolling');
      return true;
    }
    
    debugLog(`Grid reference found, checking separator index for ${yearMonth}`);
    
    // Essayer d'abord avec l'index du séparateur (si disponible)
    const separatorIndex = separatorIndices.get(yearMonth);
    if (separatorIndex !== undefined && gridRef.current) {
      const rowIndex = Math.floor(separatorIndex / gridRef.current.props.columnCount);
      debugLog(`Scrolling to separator at index ${separatorIndex}, row ${rowIndex}`);
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex
      });
      return true;
    }
    
    debugLog(`No separator index found, trying with yearMonthToIndex for ${yearMonth}`);
    
    // Sinon, utiliser l'ancienne méthode avec yearMonthToIndex
    const mediaIndex = dateIndex.yearMonthToIndex.get(yearMonth);
    if (mediaIndex !== undefined && gridRef.current) {
      const rowIndex = Math.floor(mediaIndex / gridRef.current.props.columnCount);
      debugLog(`Scrolling to media index ${mediaIndex}, row ${rowIndex}`);
      gridRef.current.scrollToItem({
        align: 'start',
        rowIndex
      });
      return true;
    }
    
    debugLog(`Failed to scroll: no index found for ${yearMonth}`);
    return false;
  }, [dateIndex, separatorIndices, debugLog]);

  // Initialiser currentYearMonth avec le mois le plus récent disponible
  useEffect(() => {
    if (!currentYearMonth && dateIndex.years.length > 0) {
      const mostRecentYear = dateIndex.years[0]; // Les années sont triées par ordre décroissant
      const monthsForYear = dateIndex.monthsByYear.get(mostRecentYear);
      
      if (monthsForYear && monthsForYear.length > 0) {
        const mostRecentMonth = monthsForYear[monthsForYear.length - 1]; 
        const initialYearMonth = `${mostRecentYear}-${mostRecentMonth.toString().padStart(2, '0')}`;
        debugLog(`Initializing currentYearMonth to ${initialYearMonth}`);
        setCurrentYearMonth(initialYearMonth);
        setCurrentYearMonthLabel(formatMonthYearLabel(initialYearMonth));
      }
    }
  }, [dateIndex, currentYearMonth, debugLog]);

  // Mettre à jour la référence du nombre de colonnes lorsqu'il change
  useEffect(() => {
    // Si le nombre de colonnes a changé et que nous avons un mois courant
    if (gridColumnsRef.current !== columnsCount && currentYearMonth) {
      // Journaliser le changement pour le débogage
      debugLog(`Columns changed from ${gridColumnsRef.current} to ${columnsCount}, repositioning to ${currentYearMonth}`);
      
      // Sauvegarder le mois courant avant le changement
      lastYearMonthRef.current = currentYearMonth;
      
      // Désactiver temporairement les mises à jour basées sur le défilement
      isRepositioningRef.current = true;
      debugLog('Scroll-based updates disabled for repositioning');
      
      // Mettre à jour la référence des colonnes
      gridColumnsRef.current = columnsCount;
      
      // Attendre que la grille soit reconstruite avant de restaurer la position
      // Augmenter le délai pour s'assurer que la grille est entièrement reconstruite
      setTimeout(() => {
        if (lastYearMonthRef.current) {
          // Extraire année et mois
          const [year, month] = lastYearMonthRef.current.split('-').map(Number);
          
          // Restaurer la position au même mois qu'avant le changement
          // Utiliser la référence externe de grille si disponible
          if (!isNaN(year) && !isNaN(month)) {
            debugLog(`Repositioning to ${year}-${month} after column change`);
            
            if (externalGridRefRef.current?.current) {
              const gridProps = {
                columnCount: externalGridRefRef.current.current.props?.columnCount,
                rowHeight: externalGridRefRef.current.current.props?.rowHeight,
                rowCount: externalGridRefRef.current.current.props?.rowCount
              };
              debugLog('Grid properties before scrollToYearMonth:', gridProps);
            } else {
              debugLog('Warning: Grid reference not available for scrollToYearMonth');
            }
            
            scrollToYearMonth(year, month, externalGridRefRef.current);
            
            // Réactiver les mises à jour basées sur le défilement après un court délai
            setTimeout(() => {
              debugLog('Re-enabling scroll-based updates');
              isRepositioningRef.current = false;
            }, 300);
          }
        }
      }, 200); // Augmenter le délai pour s'assurer que la grille est correctement reconstruite
    } else {
      // Si c'est la première initialisation, simplement mettre à jour la référence
      gridColumnsRef.current = columnsCount;
    }
  }, [columnsCount, currentYearMonth, debugLog, scrollToYearMonth]);

  // Créer une structure de données enrichie avec des séparateurs de mois/année
  const enrichedGalleryItems = useMemo(() => {
    debugLog(`Calculating enrichedGalleryItems with columnsCount: ${columnsCount}`);
    
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
    
    debugLog(`Found ${sortedYearMonths.length} year-months for separator creation`);
    
    // Pour chaque mois/année
    for (const yearMonth of sortedYearMonths) {
      // Vérifier si nous sommes au début d'une ligne (dans une grille virtuelle)
      // Si nous ne sommes pas au début d'une ligne, ajouter des éléments vides pour compléter la ligne
      // Utiliser le paramètre columnsCount au lieu de la valeur codée en dur
      const isStartOfRow = items.length % columnsCount === 0;
      
      if (!isStartOfRow) {
        // Calculer combien d'éléments vides nous devons ajouter pour atteindre le début de la ligne suivante
        // Utiliser columnsCount au lieu de la valeur codée en dur
        const itemsToAdd = columnsCount - (items.length % columnsCount);
        debugLog(`Adding ${itemsToAdd} empty items to align separator for ${yearMonth}`);
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

    debugLog(`Created ${items.length} enriched gallery items (including separators and empty cells)`);
    
    return items;
  }, [mediaListResponse, columnsCount, debugLog]); // Correction: utiliser directement columnsCount au lieu de gridColumnsRef.current

  // Créer un index optimisé des séparateurs pour une recherche efficace
  const sortedSeparatorPositions = useMemo(() => {
    const positions: {index: number, yearMonth: string}[] = [];
    
    enrichedGalleryItems.forEach((item) => {
      if (item.type === 'separator') {
        positions.push({index: item.index, yearMonth: item.yearMonth});
      }
    });
    
    // Tri par index croissant
    const sorted = positions.sort((a, b) => a.index - b.index);
    
    debugLog(`Created sortedSeparatorPositions with ${sorted.length} separators`);
    // Log quelques exemples de positions sans afficher toute la liste
    if (sorted.length > 0) {
      debugLog(`First separator: index=${sorted[0].index}, yearMonth=${sorted[0].yearMonth}`);
      if (sorted.length > 1) {
        debugLog(`Last separator: index=${sorted[sorted.length-1].index}, yearMonth=${sorted[sorted.length-1].yearMonth}`);
      }
    }
    
    return sorted;
  }, [enrichedGalleryItems, debugLog]);

  // Index pour accéder rapidement à un séparateur par yearMonth
  const separatorIndices = useMemo(() => {
    const indices = new Map<string, number>();
    enrichedGalleryItems.forEach((item, index) => {
      if (item.type === 'separator') {
        indices.set(item.yearMonth, index);
      }
    });
    
    debugLog(`Created separatorIndices map with ${indices.size} entries`);
    
    return indices;
  }, [enrichedGalleryItems, debugLog]);

  // Nouvelle fonction optimisée: calculer le mois-année à partir d'une position de défilement
  // Ajout d'une zone de tolérance pour la détection du mois courant
  const getYearMonthFromScrollPosition = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    // Ne pas calculer si désactivé pendant le repositionnement
    if (isRepositioningRef.current) {
      debugLog('getYearMonthFromScrollPosition skipped: repositioning in progress');
      return null;
    }
    
    if (!gridRef.current || sortedSeparatorPositions.length === 0) {
      debugLog(`getYearMonthFromScrollPosition failed: gridRef.current=${!!gridRef.current}, separators=${sortedSeparatorPositions.length}`);
      return null;
    }
    
    const rowHeight = gridRef.current.props.rowHeight;
    const columnCount = gridRef.current.props.columnCount;
    
    debugLog(`Calculating yearMonth from scrollTop=${scrollTop}, rowHeight=${rowHeight}, columnCount=${columnCount}`);
    
    // Calculer l'index de la première ligne visible
    const visibleRowIndex = Math.floor(scrollTop / rowHeight);
    
    // Zone de tolérance: analyser les deux premières lignes visibles
    const toleranceRows = 2;
    
    // Chercher des séparateurs dans la zone de tolérance (2 premières lignes visibles)
    const separatorsInToleranceZone = [];
    
    for (let i = 0; i < toleranceRows; i++) {
      const rowStartIndex = (visibleRowIndex + i) * columnCount;
      const rowEndIndex = rowStartIndex + columnCount - 1;
      
      debugLog(`Checking for separators in row ${visibleRowIndex + i}, indices ${rowStartIndex}-${rowEndIndex}`);
      
      // Chercher des séparateurs dans cette ligne
      for (const sep of sortedSeparatorPositions) {
        if (sep.index >= rowStartIndex && sep.index <= rowEndIndex) {
          separatorsInToleranceZone.push(sep);
          debugLog(`Found separator in tolerance zone: index=${sep.index}, yearMonth=${sep.yearMonth}`);
        }
      }
    }
    
    // Si nous avons trouvé des séparateurs dans la zone de tolérance,
    // retourner le premier (celui le plus haut dans la page)
    if (separatorsInToleranceZone.length > 0) {
      // Trier par index croissant pour obtenir le premier séparateur
      separatorsInToleranceZone.sort((a, b) => a.index - b.index);
      const result = separatorsInToleranceZone[0].yearMonth;
      debugLog(`Returning yearMonth from tolerance zone: ${result}`);
      return result;
    }
    
    debugLog('No separators found in tolerance zone, using binary search');
    
    // Si aucun séparateur n'est trouvé dans la zone de tolérance,
    // revenir à la méthode originale (recherche binaire)
    
    // Calculer l'index du premier élément de la première ligne visible
    const firstVisibleItemIndex = visibleRowIndex * columnCount;
    
    debugLog(`Binary search for firstVisibleItemIndex=${firstVisibleItemIndex}`);
    
    // Recherche binaire pour trouver le dernier séparateur avant le premier élément visible
    let left = 0;
    let right = sortedSeparatorPositions.length - 1;
    let result = null;
    
    // Si nous sommes avant le premier séparateur
    if (firstVisibleItemIndex < sortedSeparatorPositions[0].index) {
      debugLog('Position is before first separator');
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
    
    if (result) {
      debugLog(`Binary search result: ${result}`);
    } else {
      debugLog('Binary search found no result');
    }
    
    return result;
  }, [sortedSeparatorPositions, debugLog]);

  // Mise à jour du mois-année courant lors du défilement
  useEffect(() => {
    // Créer une fonction throttle pour éviter trop de mises à jour
    if (!throttledUpdateRef.current) {
      throttledUpdateRef.current = throttle((scrollTop: number, gridRef: React.RefObject<any>) => {
        // Obtenir le nouveau mois-année
        const newYearMonth = getYearMonthFromScrollPosition(scrollTop, gridRef);
        
        // Mettre à jour l'état si nécessaire
        if (newYearMonth && newYearMonth !== currentYearMonth) {
          debugLog(`Updating current year-month from ${currentYearMonth} to ${newYearMonth}`);
          setCurrentYearMonth(newYearMonth);
          setCurrentYearMonthLabel(formatMonthYearLabel(newYearMonth));
        }
      }, 100);
    }
  }, [getYearMonthFromScrollPosition, currentYearMonth, debugLog]);

  // Fonction pour mettre à jour le mois courant lors d'un défilement
  const updateCurrentYearMonthFromScroll = useCallback((scrollTop: number, gridRef: React.RefObject<any>) => {
    // Ne pas mettre à jour si nous sommes en train de repositionner
    if (isRepositioningRef.current) {
      debugLog('Scroll update skipped: repositioning in progress');
      return;
    }
    
    // Sauvegarder la référence externe de la grille pour les repositionnements futurs
    if (gridRef && !externalGridRefRef.current) {
      debugLog('Saving external grid reference');
      externalGridRefRef.current = gridRef;
    }
    
    if (throttledUpdateRef.current) {
      debugLog(`Throttled update called with scrollTop=${scrollTop}`);
      throttledUpdateRef.current(scrollTop, gridRef);
    }
  }, [debugLog]);

  // MODIFICATION: Naviguer au mois suivant chronologiquement (plus récent)
  const navigateToPreviousMonth = useCallback((gridRef: React.RefObject<any>) => {
    if (!currentYearMonth || !gridRef.current) return false;
    
    debugLog(`navigateToPreviousMonth called, current=${currentYearMonth}`);
    
    // Obtenir tous les yearMonth disponibles triés chronologiquement (du plus récent au plus ancien)
    const allYearMonths = Array.from(dateIndex.yearMonthToIndex.keys()).sort((a, b) => b.localeCompare(a));
    
    // Trouver l'index de l'année-mois actuel
    const currentIndex = allYearMonths.indexOf(currentYearMonth);
    
    if (currentIndex < allYearMonths.length - 1) {
      // CORRECTION: Aller au mois plus ancien (next dans l'ordre de tri mais previous chronologiquement)
      const nextYearMonth = allYearMonths[currentIndex + 1];
      const [nextYear, nextMonth] = nextYearMonth.split('-').map(Number);
      
      debugLog(`Navigating to previous month: ${nextYearMonth}`);
      return scrollToYearMonth(nextYear, nextMonth, gridRef);
    }
    
    debugLog('No previous month available');
    return false;
  }, [currentYearMonth, dateIndex.yearMonthToIndex, scrollToYearMonth, debugLog]);

  // MODIFICATION: Naviguer au mois précédent chronologiquement (plus ancien)
  const navigateToNextMonth = useCallback((gridRef: React.RefObject<any>) => {
    if (!currentYearMonth || !gridRef.current) return false;
    
    debugLog(`navigateToNextMonth called, current=${currentYearMonth}`);
    
    // Obtenir tous les yearMonth disponibles triés chronologiquement (du plus récent au plus ancien)
    const allYearMonths = Array.from(dateIndex.yearMonthToIndex.keys()).sort((a, b) => b.localeCompare(a));
    
    // Trouver l'index de l'année-mois actuel
    const currentIndex = allYearMonths.indexOf(currentYearMonth);
    
    if (currentIndex > 0) {
      // CORRECTION: Aller au mois plus récent (previous dans l'ordre de tri mais next chronologiquement)
      const previousYearMonth = allYearMonths[currentIndex - 1];
      const [prevYear, prevMonth] = previousYearMonth.split('-').map(Number);
      
      debugLog(`Navigating to next month: ${previousYearMonth}`);
      return scrollToYearMonth(prevYear, prevMonth, gridRef);
    }
    
    debugLog('No next month available');
    return false;
  }, [currentYearMonth, dateIndex.yearMonthToIndex, scrollToYearMonth, debugLog]);

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
