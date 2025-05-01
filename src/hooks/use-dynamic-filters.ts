import { useQuery } from '@tanstack/react-query';
import { fetchFilters, DynamicFilter } from '@/api/imageApi';

export function useDynamicFilters() {
  const { data: filters, isLoading, error } = useQuery({
    queryKey: ['filters'],
    queryFn: fetchFilters,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  return {
    filters,
    isLoading,
    error
  };
} 