import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Hook to get dashboard statistics
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
  });
}
