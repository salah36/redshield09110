import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Hook to get authentication status
export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => api.getAuthStatus(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

// Hook to get current user info (requires authentication)
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.getCurrentUser(),
    retry: false,
  });
}

// Hook to login with Discord
export function useLogin() {
  return () => {
    api.loginWithDiscord();
  };
}

// Hook to logout
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
      // Redirect to home page
      window.location.href = '/';
    },
  });
}
