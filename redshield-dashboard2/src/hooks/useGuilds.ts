import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type PunishmentType } from '@/lib/api';

// Hook to get all guild configs
export function useGuilds() {
  return useQuery({
    queryKey: ['guilds'],
    queryFn: () => api.getGuilds(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to get a single guild config
export function useGuild(guildId: string) {
  return useQuery({
    queryKey: ['guilds', guildId],
    queryFn: () => api.getGuild(guildId),
    enabled: !!guildId,
  });
}

// Hook to update a guild config
export function useUpdateGuild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      guildId,
      data,
    }: {
      guildId: string;
      data: {
        enabled?: boolean;
        punishment_type?: PunishmentType;
        role_id?: string;
        kick_reason?: string;
        ban_reason?: string;
      };
    }) => api.updateGuild(guildId, data),
    onSuccess: (_, variables) => {
      // Invalidate specific guild and list
      queryClient.invalidateQueries({ queryKey: ['guilds', variables.guildId] });
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
    },
  });
}
