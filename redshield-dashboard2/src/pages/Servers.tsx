import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, Server, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type GuildConfig, type PunishmentType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Servers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guilds, isLoading, error } = useQuery({
    queryKey: ['guilds'],
    queryFn: () => api.getGuilds(),
  });

  const updateGuildMutation = useMutation({
    mutationFn: ({ guildId, data }: { guildId: string; data: Partial<GuildConfig> }) =>
      api.updateGuild(guildId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guilds'] });
      toast({
        title: "Success",
        description: "Server configuration updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update server configuration.",
        variant: "destructive",
      });
    },
  });

  const handleToggleActioning = (guildId: string, enabled: boolean) => {
    updateGuildMutation.mutate({
      guildId,
      data: { actioning_enabled: enabled },
    });
  };

  const handleToggleGlobalScan = (guildId: string, enabled: boolean) => {
    updateGuildMutation.mutate({
      guildId,
      data: { global_scan_enabled: enabled },
    });
  };

  const handlePunishmentChange = (guildId: string, punishment: PunishmentType) => {
    updateGuildMutation.mutate({
      guildId,
      data: { punishment },
    });
  };

  const handleLogChannelChange = (guildId: string, channelId: string) => {
    updateGuildMutation.mutate({
      guildId,
      data: { log_channel_id: channelId || null },
    });
  };

  const handlePunishRoleChange = (guildId: string, roleId: string) => {
    updateGuildMutation.mutate({
      guildId,
      data: { punish_role_id: roleId || null },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-orbitron font-bold text-xl">
              Red<span className="text-primary">Shield</span> Dashboard
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Server Management</CardTitle>
            <CardDescription>Manage protected Discord servers and their configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading servers...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading servers. Please try again.
              </div>
            ) : guilds && guilds.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server ID</TableHead>
                      <TableHead>Server Name</TableHead>
                      <TableHead>Actioning</TableHead>
                      <TableHead>Global Scan</TableHead>
                      <TableHead>Punishment</TableHead>
                      <TableHead>Log Channel ID</TableHead>
                      <TableHead>Punish Role ID</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {guilds.map((guild) => (
                      <TableRow key={guild.guild_id}>
                        <TableCell className="font-mono text-sm">{guild.guild_id}</TableCell>
                        <TableCell>{guild.guild_name || 'Unknown Server'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={guild.actioning_enabled}
                              onCheckedChange={(checked) => handleToggleActioning(guild.guild_id, checked)}
                            />
                            <Badge variant={guild.actioning_enabled ? "default" : "secondary"}>
                              {guild.actioning_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={guild.global_scan_enabled}
                              onCheckedChange={(checked) => handleToggleGlobalScan(guild.guild_id, checked)}
                            />
                            <Badge variant={guild.global_scan_enabled ? "default" : "secondary"}>
                              {guild.global_scan_enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={guild.punishment}
                            onValueChange={(value) => handlePunishmentChange(guild.guild_id, value as PunishmentType)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KICK">Kick</SelectItem>
                              <SelectItem value="BAN">Ban</SelectItem>
                              <SelectItem value="ROLE">Assign Role</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="font-mono text-xs w-[180px]"
                            placeholder="Channel ID"
                            value={guild.log_channel_id || ''}
                            onChange={(e) => handleLogChannelChange(guild.guild_id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="font-mono text-xs w-[180px]"
                            placeholder="Role ID"
                            value={guild.punish_role_id || ''}
                            onChange={(e) => handlePunishRoleChange(guild.guild_id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(guild.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No servers available</p>
                <p className="text-sm mt-1">
                  {/* Contributors without linked servers see this message */}
                  Contact the Owner to link you to a server for management access
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Servers;
