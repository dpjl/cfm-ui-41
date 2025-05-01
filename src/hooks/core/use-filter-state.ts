import { useState, useEffect } from 'react';
import { MediaFilter } from '@/components/AppSidebar';
import { useDynamicFilters } from '@/hooks/use-dynamic-filters';

/**
 * Hook de base pour gérer l'état des filtres de médias
 */
export function useFilterState(initialLeftFilter: MediaFilter = 'all', initialRightFilter: MediaFilter = 'all') {
  const [leftFilter, setLeftFilter] = useState<MediaFilter>(initialLeftFilter);
  const [rightFilter, setRightFilter] = useState<MediaFilter>(initialRightFilter);
  const { filters } = useDynamicFilters();

  // Reset filters if they're not in the available filters list
  useEffect(() => {
    if (filters) {
      const filterIds = filters.map(f => f.id);
      if (!filterIds.includes(leftFilter)) {
        setLeftFilter('all');
      }
      if (!filterIds.includes(rightFilter)) {
        setRightFilter('all');
      }
    }
  }, [filters, leftFilter, rightFilter]);
  
  return {
    leftFilter,
    setLeftFilter,
    rightFilter,
    setRightFilter
  };
}
