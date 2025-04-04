
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types pour les filtres et le tri
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'between';

export interface FilterCondition {
  column: string;
  operator: FilterOperator;
  value: string | number | boolean | null | [any, any]; // 'between' utilise un tableau de 2 valeurs
}

export interface FilterRequest {
  conditions: FilterCondition[];
  logic: 'and' | 'or'; // Comment combiner les conditions
}

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DbViewerState {
  directory: string;
  isOpen: boolean;
  page: number;
  pageSize: number;
  sort: SortConfig | null;
  filter: FilterRequest;
  position: 'source' | 'destination';
}

// Interface pour les données renvoyées par l'API
export interface DbViewerData {
  data: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  columns: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'image';
  }[];
}

// API réelle avec fallback sur des données mockées
const fetchDbData = async ({
  directory,
  page,
  pageSize,
  sort,
  filter,
  position
}: Omit<DbViewerState, 'isOpen'>): Promise<DbViewerData> => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  console.log('Fetching DB data with params:', { directory, page, pageSize, sort, filter, position });
  
  try {
    // Construction des paramètres de requête
    const params = new URLSearchParams();
    params.append('directory', position);
    params.append('folder', directory);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    if (sort) {
      params.append('sortColumn', sort.column);
      params.append('sortDirection', sort.direction);
    }
    
    if (filter && filter.conditions.length > 0) {
      params.append('filter', JSON.stringify(filter));
    }
    
    // Appel à l'API
    const response = await fetch(`${API_BASE_URL}/db?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server responded with error:", response.status, errorText);
      throw new Error(`Failed to fetch DB data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Received DB data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching DB data, falling back to mock data:", error);
    
    // Fallback sur des données mockées en cas d'erreur
    // Simulation d'un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Générer des données de test
    const mockColumns = [
      { key: 'id', label: 'ID', type: 'number' as const },
      { key: 'filename', label: 'Nom du fichier', type: 'text' as const },
      { key: 'date', label: 'Date', type: 'date' as const },
      { key: 'size', label: 'Taille (Ko)', type: 'number' as const },
      { key: 'type', label: 'Type', type: 'text' as const },
      { key: 'resolution', label: 'Résolution', type: 'text' as const },
      { key: 'isPublic', label: 'Public', type: 'boolean' as const },
    ];
    
    // Total items pour la pagination
    const totalItems = 235;
    
    // Générer des données mock pour cette page
    const mockData = Array.from({ length: pageSize }, (_, i) => {
      const index = (page - 1) * pageSize + i;
      if (index >= totalItems) return null;
      
      return {
        id: index + 1,
        filename: `IMG_${(1000 + index).toString()}.jpg`,
        date: new Date(2023, Math.floor(index / 30), (index % 30) + 1).toISOString(),
        size: Math.floor(Math.random() * 5000) + 500,
        type: ['JPEG', 'PNG', 'RAW', 'HEIC'][Math.floor(Math.random() * 4)],
        resolution: ['1920x1080', '4000x3000', '3840x2160', '1280x720'][Math.floor(Math.random() * 4)],
        isPublic: Math.random() > 0.5,
      };
    }).filter(Boolean);
    
    // Appliquer le filtre (version simplifiée pour le mock)
    let filteredData = [...mockData];
    if (filter && filter.conditions.length > 0) {
      filteredData = mockData.filter(item => {
        const results = filter.conditions.map(condition => {
          const value = item[condition.column];
          switch (condition.operator) {
            case 'eq': return value === condition.value;
            case 'contains': return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
            case 'gt': return value > condition.value;
            case 'lt': return value < condition.value;
            // Autres opérateurs simplifiés pour le mock
            default: return true;
          }
        });
        
        return filter.logic === 'and' 
          ? results.every(Boolean) 
          : results.some(Boolean);
      });
    }
    
    // Appliquer le tri
    if (sort) {
      filteredData.sort((a, b) => {
        if (a[sort.column] < b[sort.column]) return sort.direction === 'asc' ? -1 : 1;
        if (a[sort.column] > b[sort.column]) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return {
      data: filteredData,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
      columns: mockColumns,
    };
  }
};

export function useDbViewer() {
  const [state, setState] = useState<DbViewerState>({
    directory: '',
    isOpen: false,
    page: 1,
    pageSize: 25,
    sort: null,
    filter: { conditions: [], logic: 'and' },
    position: 'source'
  });
  
  // Requête React Query pour charger les données
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['dbViewer', state.directory, state.page, state.pageSize, state.sort, state.filter, state.position],
    queryFn: () => fetchDbData({
      directory: state.directory,
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
      filter: state.filter,
      position: state.position
    }),
    enabled: state.isOpen && Boolean(state.directory)
  });
  
  // Ouvrir le visualiseur
  const openViewer = (directory: string, position: 'source' | 'destination') => {
    setState({
      ...state,
      directory,
      position,
      isOpen: true,
      page: 1, // Reset à la première page
      filter: { conditions: [], logic: 'and' } // Reset les filtres
    });
  };
  
  // Fermer le visualiseur
  const closeViewer = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };
  
  // Pagination
  const goToPage = (page: number) => {
    setState(prev => ({ ...prev, page }));
  };
  
  // Taille de la page
  const setPageSize = (pageSize: number) => {
    setState(prev => ({ ...prev, pageSize, page: 1 }));
  };
  
  // Tri
  const setSorting = (column: string, direction: 'asc' | 'desc') => {
    setState(prev => ({ 
      ...prev, 
      sort: { column, direction },
      page: 1 // Retourner à la première page lors du changement de tri
    }));
  };
  
  // Filtrage
  const setFilter = (filter: FilterRequest) => {
    setState(prev => ({ 
      ...prev, 
      filter,
      page: 1 // Retourner à la première page lors du changement de filtre
    }));
  };
  
  // Ajouter un filtre
  const addFilterCondition = (condition: FilterCondition) => {
    setState(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        conditions: [...prev.filter.conditions, condition]
      },
      page: 1
    }));
  };
  
  // Supprimer un filtre
  const removeFilterCondition = (index: number) => {
    setState(prev => {
      const newConditions = [...prev.filter.conditions];
      newConditions.splice(index, 1);
      return {
        ...prev,
        filter: {
          ...prev.filter,
          conditions: newConditions
        },
        page: 1
      };
    });
  };
  
  // Changer la logique de filtrage (AND/OR)
  const setFilterLogic = (logic: 'and' | 'or') => {
    setState(prev => ({
      ...prev,
      filter: {
        ...prev.filter,
        logic
      }
    }));
  };
  
  return {
    state,
    data,
    isLoading,
    isError,
    error,
    refetch,
    openViewer,
    closeViewer,
    goToPage,
    setPageSize,
    setSorting,
    setFilter,
    addFilterCondition,
    removeFilterCondition,
    setFilterLogic
  };
}
