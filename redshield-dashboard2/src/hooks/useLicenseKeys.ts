import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, type LicenseKeyFilters } from '@/lib/api';

// ============================================================================
// OWNER HOOKS - License Key Management
// ============================================================================

// Hook to get paginated license keys with filters (Owner only)
export function useLicenseKeys(filters?: LicenseKeyFilters) {
  return useQuery({
    queryKey: ['license-keys', filters],
    queryFn: () => api.getLicenseKeys(filters),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to get a single license key (Owner only)
export function useLicenseKey(id: number) {
  return useQuery({
    queryKey: ['license-keys', id],
    queryFn: () => api.getLicenseKey(id),
    enabled: !!id && id > 0,
  });
}

// Hook to get license key statistics (Owner only)
export function useLicenseKeyStats() {
  return useQuery({
    queryKey: ['license-keys', 'stats'],
    queryFn: () => api.getLicenseKeyStats(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to generate a new license key (Owner only)
export function useGenerateLicenseKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { duration_days: number; notes?: string }) =>
      api.generateLicenseKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-keys'] });
    },
  });
}

// Hook to batch generate license keys (Owner only)
export function useGenerateLicenseKeysBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { count: number; duration_days: number; notes?: string }) =>
      api.generateLicenseKeysBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-keys'] });
    },
  });
}

// Hook to delete a license key (Owner only)
export function useDeleteLicenseKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteLicenseKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-keys'] });
    },
  });
}

// Hook to revoke a license key (Owner only)
export function useRevokeLicenseKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.revokeLicenseKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-keys'] });
    },
  });
}

// ============================================================================
// USER HOOKS - License Claiming
// ============================================================================

// Hook to get current user's license status
export function useMyLicense() {
  return useQuery({
    queryKey: ['my-license'],
    queryFn: () => api.getMyLicense(),
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook to claim a license key
export function useClaimLicenseKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (licenseKey: string) => api.claimLicenseKey(licenseKey),
    onSuccess: () => {
      // Invalidate license queries to refresh status
      queryClient.invalidateQueries({ queryKey: ['my-license'] });
      queryClient.invalidateQueries({ queryKey: ['license-keys'] });
      // Also invalidate user info as role may have changed
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
