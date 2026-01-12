import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, type BlacklistFilters, type ReasonType } from '@/lib/api';

// Hook to get paginated blacklist entries with filters
export function useBlacklist(filters?: BlacklistFilters) {
  return useQuery({
    queryKey: ['blacklist', filters],
    queryFn: () => api.getBlacklist(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to get a single blacklist entry
export function useBlacklistEntry(id: string) {
  return useQuery({
    queryKey: ['blacklist', id],
    queryFn: () => api.getBlacklistEntry(id),
    enabled: !!id,
  });
}

// Hook to add a new blacklist entry
export function useAddBlacklistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      discord_user_id?: string;
      license: string;
      reason_type: ReasonType;
      reason_details?: string;
      notes?: string;
    }) => api.addBlacklistEntry(data),
    onSuccess: () => {
      // Invalidate and refetch blacklist queries
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// Hook to update a blacklist entry
export function useUpdateBlacklistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        reason_details?: string;
        notes?: string;
      };
    }) => api.updateBlacklistEntry(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific entry and list
      queryClient.invalidateQueries({ queryKey: ['blacklist', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
  });
}

// Hook to revoke a blacklist entry
export function useRevokeBlacklistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.revokeBlacklistEntry(id),
    onSuccess: () => {
      // Invalidate all blacklist queries and stats
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
