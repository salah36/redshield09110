// API Client for RedShield Dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

// ============================================================================
// TYPES
// ============================================================================

export type ReasonType = 'CHEAT' | 'GLITCH' | 'DUPLICATE' | 'OTHER';
export type EntryStatus = 'ACTIVE' | 'REVOKED';
export type PunishmentType = 'KICK' | 'BAN' | 'ROLE';

export interface BlacklistEntry {
  id: string;
  discord_user_id?: string;
  license: string;
  reason_type: ReasonType;
  reason_text?: string;
  proof_url: string;
  server_name: string;
  other_server?: string;
  status: EntryStatus;
  created_at: string;
  updated_at?: string;
  revoked_at?: string;
  created_by: string;
  revoked_by?: string;
}

export interface GuildConfig {
  guild_id: string;
  guild_name: string;
  member_count?: number;
  actioning_enabled: boolean;
  global_scan_enabled: boolean;
  punishment: PunishmentType;
  punish_role_id?: string;
  log_channel_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Stats {
  blacklist: {
    total: number;
    active: number;
    revoked: number;
    recentWeek: number;
  };
  guilds: {
    total: number;
    enabled: number;
  };
  reasonTypes: {
    CHEAT?: number;
    GLITCH?: number;
    DUPLICATE?: number;
    OTHER?: number;
  };
}

export interface UserLicenseInfo {
  license_key: string;
  status: LicenseKeyStatus;
  duration_days: number;
  claimed_at: string;
  expires_at: string;
  is_active: boolean;
  days_remaining: number;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  isContributor: boolean;
  isOwner: boolean;
  license?: UserLicenseInfo | null;
}

export interface DashboardUser {
  discord_user_id: string;
  username: string;
  discriminator: string;
  avatar: string;
  linked_server_id?: string;
  role: 'OWNER' | 'CONTRIBUTOR';
  is_active: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedStats {
  blacklist: {
    total: number;
    active: number;
    revoked: number;
    by_reason: Record<string, number>;
  };
  dashboard_users: {
    total: number;
    online: number;
    offline: number;
  };
  guilds: {
    total: number;
  };
}

export interface TrustedPartner {
  id: number;
  discord_link: string;
  discord_server_id: string;
  server_icon_url?: string;
  display_name: string;
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ============================================================================
// LICENSE KEY TYPES
// ============================================================================

export type LicenseKeyStatus = 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'REVOKED';

export interface LicenseKey {
  id: number;
  license_key: string;
  status: LicenseKeyStatus;
  duration_days: number;
  claimed_by?: string;
  claimed_by_username?: string;
  claimed_by_avatar?: string;
  claimed_at?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface LicenseKeyFilters extends PaginationParams {
  status?: LicenseKeyStatus;
  claimed_by?: string;
}

export interface MyLicenseResponse {
  has_license: boolean;
  license?: {
    id: number;
    license_key: string;
    status: LicenseKeyStatus;
    duration_days: number;
    claimed_at: string;
    expires_at: string;
    is_active: boolean;
    days_remaining: number;
  };
}

export interface LicenseKeyStats {
  total_generated: number;
  by_status: Record<string, number>;
  by_duration: Record<string, number>;
  claimed_this_week: number;
}

export interface ClaimLicenseResponse {
  message: string;
  license_key: string;
  duration_days: number;
  expires_at: string;
}

export interface BlacklistFilters extends PaginationParams {
  status?: EntryStatus;
  reason_type?: ReasonType;
  license?: string;
  discord_user_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  async getAuthStatus() {
    return this.request<{ authenticated: boolean; user: User | null }>('/auth/status');
  }

  async getCurrentUser() {
    return this.request<User>('/api/user/me');
  }

  loginWithDiscord() {
    window.location.href = `${this.baseUrl}/auth/discord`;
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  // ============================================================================
  // BLACKLIST METHODS
  // ============================================================================

  async getBlacklist(params?: BlacklistFilters) {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<PaginatedResponse<BlacklistEntry>>(
      `/api/blacklist${query ? `?${query}` : ''}`
    );
  }

  async getBlacklistEntry(id: string) {
    return this.request<BlacklistEntry>(`/api/blacklist/${id}`);
  }

  async addBlacklistEntry(data: {
    discord_user_id?: string;
    license: string;
    reason_type: ReasonType;
    reason_text?: string;
    proof_url: string;
    server_name: string;
    other_server?: string;
  }) {
    return this.request<{ id: string; message: string }>('/api/blacklist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBlacklistEntry(
    id: string,
    data: {
      reason_type?: ReasonType;
      reason_text?: string;
      proof_url?: string;
      server_name?: string;
      other_server?: string;
    }
  ) {
    return this.request<{ message: string }>(`/api/blacklist/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async revokeBlacklistEntry(id: string) {
    return this.request<{ message: string }>(`/api/blacklist/${id}/revoke`, {
      method: 'POST',
    });
  }

  async deleteBlacklistEntry(id: string) {
    return this.request<{ message: string }>(`/api/blacklist/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // BOT MANAGEMENT METHODS (Owner Only)
  // ============================================================================

  async getBotInfo() {
    return this.request<any>('/api/bot/info');
  }

  async getBotStats() {
    return this.request<any>('/api/bot/stats');
  }

  async updateBotUsername(username: string) {
    return this.request<any>('/api/bot/profile/username', {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    });
  }

  async updateBotAvatar(avatar: string) {
    return this.request<any>('/api/bot/profile/avatar', {
      method: 'PATCH',
      body: JSON.stringify({ avatar }),
    });
  }

  async getBotPresence() {
    return this.request<any>('/api/bot/presence');
  }

  async updateBotPresence(status: string, activityType?: number, activityName?: string) {
    return this.request<any>('/api/bot/presence', {
      method: 'POST',
      body: JSON.stringify({ status, activityType, activityName }),
    });
  }

  async getBotGuilds() {
    return this.request<any[]>('/api/bot/guilds');
  }

  async leaveGuild(guildId: string) {
    return this.request<{ message: string }>(`/api/bot/guilds/${guildId}/leave`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // GUILD CONFIG METHODS
  // ============================================================================

  async getGuilds() {
    return this.request<GuildConfig[]>('/api/guilds');
  }

  async getGuild(guildId: string) {
    return this.request<GuildConfig>(`/api/guilds/${guildId}`);
  }

  async updateGuild(
    guildId: string,
    data: {
      actioning_enabled?: boolean;
      global_scan_enabled?: boolean;
      punishment?: PunishmentType;
      punish_role_id?: string;
      log_channel_id?: string;
    }
  ) {
    return this.request<{ message: string }>(`/api/guilds/${guildId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // STATS METHODS
  // ============================================================================

  async getStats() {
    return this.request<Stats>('/api/stats');
  }

  async getPublicStats() {
    return this.request<Stats>('/api/public/stats');
  }

  // ============================================================================
  // OWNER-ONLY METHODS
  // ============================================================================

  async getDashboardUsers() {
    return this.request<DashboardUser[]>('/api/dashboard-users');
  }

  async updateUserServerLink(userId: string, serverId: string | null) {
    return this.request<DashboardUser>(`/api/dashboard-users/${userId}/server-link`, {
      method: 'PATCH',
      body: JSON.stringify({ linked_server_id: serverId }),
    });
  }

  async getEnhancedStats() {
    return this.request<EnhancedStats>('/api/stats/enhanced');
  }

  // ============================================================================
  // TRUSTED PARTNERS METHODS (Owner-only)
  // ============================================================================

  async getTrustedPartners() {
    return this.request<TrustedPartner[]>('/api/trusted-partners');
  }

  async getPublicTrustedPartners() {
    return this.request<TrustedPartner[]>('/api/public/trusted-partners');
  }

  async addTrustedPartner(data: {
    discord_link: string;
    discord_server_id: string;
    server_icon_url?: string;
    display_name: string;
    notes?: string;
  }) {
    return this.request<TrustedPartner>('/api/trusted-partners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrustedPartner(
    serverId: string,
    data: {
      discord_link?: string;
      server_icon_url?: string;
      display_name?: string;
      notes?: string;
    }
  ) {
    return this.request<TrustedPartner>(`/api/trusted-partners/${serverId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTrustedPartner(serverId: string) {
    return this.request<{ message: string }>(`/api/trusted-partners/${serverId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // LICENSE KEY METHODS
  // ============================================================================

  // Get all license keys with pagination and filtering (Owner only)
  async getLicenseKeys(params?: LicenseKeyFilters) {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    return this.request<PaginatedResponse<LicenseKey>>(
      `/api/license-keys${query ? `?${query}` : ''}`
    );
  }

  // Get single license key (Owner only)
  async getLicenseKey(id: number) {
    return this.request<LicenseKey>(`/api/license-keys/${id}`);
  }

  // Generate a new license key (Owner only)
  async generateLicenseKey(data: { duration_days: number; notes?: string }) {
    return this.request<LicenseKey>('/api/license-keys/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Batch generate license keys (Owner only)
  async generateLicenseKeysBatch(data: {
    count: number;
    duration_days: number;
    notes?: string;
  }) {
    return this.request<{
      message: string;
      keys: Array<{
        id: number;
        license_key: string;
        duration_days: number;
        status: string;
      }>;
    }>('/api/license-keys/generate-batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Delete license key (Owner only)
  async deleteLicenseKey(id: number) {
    return this.request<{ message: string }>(`/api/license-keys/${id}`, {
      method: 'DELETE',
    });
  }

  // Revoke license key (Owner only)
  async revokeLicenseKey(id: number) {
    return this.request<{ message: string }>(`/api/license-keys/${id}/revoke`, {
      method: 'POST',
    });
  }

  // Get license key statistics (Owner only)
  async getLicenseKeyStats() {
    return this.request<LicenseKeyStats>('/api/license-keys/stats/summary');
  }

  // Claim a license key (Authenticated users)
  async claimLicenseKey(licenseKey: string) {
    return this.request<ClaimLicenseResponse>('/api/license-keys/claim', {
      method: 'POST',
      body: JSON.stringify({ license_key: licenseKey }),
    });
  }

  // Get current user's license status (Authenticated users)
  async getMyLicense() {
    return this.request<MyLicenseResponse>('/api/license-keys/my-license');
  }

  // ============================================================================
  // ADMIN USER MANAGEMENT METHODS (Owner Only)
  // ============================================================================

  // Update user role
  async updateUserRole(userId: string, role: string) {
    return this.request<{ message: string; role: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // Ban/unban user
  async banUser(userId: string, banned: boolean) {
    return this.request<{ message: string; is_active: boolean }>(`/api/admin/users/${userId}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ banned }),
    });
  }

  // Delete user
  async deleteUser(userId: string) {
    return this.request<{ message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Revoke user's license
  async revokeUserLicense(userId: string) {
    return this.request<{ message: string; licensesRevoked: number }>(`/api/admin/users/${userId}/revoke-license`, {
      method: 'PATCH',
    });
  }

  // Get single user details with licenses
  async getAdminUserDetails(userId: string) {
    return this.request<{ user: DashboardUser; licenses: any[] }>(`/api/admin/users/${userId}`);
  }
}

// Export singleton instance
export const api = new APIClient(API_BASE_URL);
