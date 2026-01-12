import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, Bot, Image, Activity, Server, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useAuth";

const BotManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  // Redirect if not owner
  useEffect(() => {
    if (!userLoading && (!user || !user.isOwner)) {
      navigate("/dashboard");
    }
  }, [user, userLoading, navigate]);

  // Bot info and stats
  const { data: botInfo, isLoading: botInfoLoading, isError: botInfoError, error: botInfoErrorData } = useQuery({
    queryKey: ['botInfo'],
    queryFn: () => api.getBotInfo(),
    enabled: !!user?.isOwner,
    retry: 1,
  });

  const { data: botStats, refetch: refetchBotStats } = useQuery({
    queryKey: ['botStats'],
    queryFn: () => api.getBotStats(),
    enabled: !!user?.isOwner,
  });

  const { data: botGuilds, refetch: refetchBotGuilds } = useQuery({
    queryKey: ['botGuilds'],
    queryFn: () => api.getBotGuilds(),
    enabled: !!user?.isOwner,
  });

  const { data: botPresence } = useQuery({
    queryKey: ['botPresence'],
    queryFn: () => api.getBotPresence(),
    enabled: !!user?.isOwner,
  });

  // State management
  const [newUsername, setNewUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [botStatus, setBotStatus] = useState("online");
  const [activityName, setActivityName] = useState("");
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [guildToLeave, setGuildToLeave] = useState<any>(null);

  // Load current presence values when botPresence data is available
  useEffect(() => {
    if (botPresence) {
      setBotStatus(botPresence.status || 'online');
      setActivityName(botPresence.activity_name || '');
    }
  }, [botPresence]);

  // Update username mutation
  const updateUsernameMutation = useMutation({
    mutationFn: (username: string) => api.updateBotUsername(username),
    onSuccess: () => {
      toast({ title: "Success", description: "Bot username updated successfully" });
      setNewUsername("");
      queryClient.invalidateQueries({ queryKey: ['botInfo'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update username", variant: "destructive" });
    },
  });

  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: (avatar: string) => api.updateBotAvatar(avatar),
    onSuccess: () => {
      toast({ title: "Success", description: "Bot avatar updated successfully" });
      setAvatarFile(null);
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['botInfo'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update avatar", variant: "destructive" });
    },
  });

  // Update presence mutation
  const updatePresenceMutation = useMutation({
    mutationFn: ({ status, activityName }: { status: string; activityName: string }) =>
      api.updateBotPresence(status, 0, activityName),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bot presence updated! Changes will appear in Discord within 10 seconds."
      });
      queryClient.invalidateQueries({ queryKey: ['botPresence'] });
      queryClient.invalidateQueries({ queryKey: ['botStats'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update presence", variant: "destructive" });
    },
  });

  // Leave guild mutation
  const leaveGuildMutation = useMutation({
    mutationFn: (guildId: string) => api.leaveGuild(guildId),
    onSuccess: () => {
      toast({ title: "Success", description: "Successfully left server" });
      setLeaveDialogOpen(false);
      setGuildToLeave(null);
      queryClient.invalidateQueries({ queryKey: ['botGuilds'] });
      queryClient.invalidateQueries({ queryKey: ['botStats'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to leave server", variant: "destructive" });
    },
  });

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 8MB", variant: "destructive" });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAvatar = () => {
    if (!avatarPreview) return;
    updateAvatarMutation.mutate(avatarPreview);
  };

  const handleUpdateUsername = () => {
    if (!newUsername || newUsername.length < 2 || newUsername.length > 32) {
      toast({ title: "Error", description: "Username must be between 2 and 32 characters", variant: "destructive" });
      return;
    }
    updateUsernameMutation.mutate(newUsername);
  };

  const handleUpdatePresence = () => {
    updatePresenceMutation.mutate({ status: botStatus, activityName });
  };

  const confirmLeaveGuild = (guild: any) => {
    setGuildToLeave(guild);
    setLeaveDialogOpen(true);
  };

  const handleLeaveGuild = () => {
    if (!guildToLeave) return;
    leaveGuildMutation.mutate(guildToLeave.id);
  };

  if (userLoading || botInfoLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Shield className="w-16 h-16 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user?.isOwner) {
    return null;
  }

  if (botInfoError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Bot Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {botInfoErrorData instanceof Error ? botInfoErrorData.message : 'Failed to fetch bot information'}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const botAvatarUrl = botInfo?.avatar
    ? `https://cdn.discordapp.com/avatars/${botInfo.id}/${botInfo.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-orbitron font-bold text-xl">
              Red<span className="text-primary">Shield</span> Bot Management
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Bot Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{botInfo?.username}</div>
              <p className="text-xs text-muted-foreground">#{botInfo?.discriminator}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{botStats?.totalGuilds || 0}</div>
              <p className="text-xs text-muted-foreground">Guilds connected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{botStats?.totalMembers || 0}</div>
              <p className="text-xs text-muted-foreground">Approximate count</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different management sections */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="presence">Status & Presence</TabsTrigger>
            <TabsTrigger value="servers">Server Management</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Bot Avatar
                  </CardTitle>
                  <CardDescription>Update the bot's profile picture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={avatarPreview || botAvatarUrl}
                      alt="Bot Avatar"
                      className="w-32 h-32 rounded-full"
                    />
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="max-w-xs"
                    />
                    {avatarPreview && (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateAvatar}
                          disabled={updateAvatarMutation.isPending}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {updateAvatarMutation.isPending ? "Updating..." : "Update Avatar"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Bot Username
                  </CardTitle>
                  <CardDescription>Change the bot's username</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Current Username</Label>
                    <Input
                      value={botInfo?.username || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUsername">New Username</Label>
                    <Input
                      id="newUsername"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username..."
                      maxLength={32}
                    />
                    <p className="text-xs text-muted-foreground">
                      2-32 characters. Note: Username changes are rate limited by Discord.
                    </p>
                  </div>
                  <Button
                    onClick={handleUpdateUsername}
                    disabled={updateUsernameMutation.isPending || !newUsername}
                    className="w-full"
                  >
                    {updateUsernameMutation.isPending ? "Updating..." : "Update Username"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Presence Tab */}
          <TabsContent value="presence">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Bot Status & Presence
                </CardTitle>
                <CardDescription>Configure the bot's online status and activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={botStatus} onValueChange={setBotStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Online
                        </div>
                      </SelectItem>
                      <SelectItem value="idle">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Idle
                        </div>
                      </SelectItem>
                      <SelectItem value="dnd">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Do Not Disturb
                        </div>
                      </SelectItem>
                      <SelectItem value="invisible">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          Invisible
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activity">Activity Name</Label>
                  <Input
                    id="activity"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="e.g., Protecting servers..."
                    maxLength={128}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will show as "Playing [activity name]"
                  </p>
                </div>

                <Button
                  onClick={handleUpdatePresence}
                  disabled={updatePresenceMutation.isPending}
                  className="w-full"
                >
                  {updatePresenceMutation.isPending ? "Updating..." : "Update Presence"}
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  Note: Presence updates may require the bot to restart to take effect.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Servers Tab */}
          <TabsContent value="servers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Server Management
                </CardTitle>
                <CardDescription>
                  View all servers the bot is in and leave servers if needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Server Name</TableHead>
                        <TableHead>Server ID</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {botGuilds && botGuilds.length > 0 ? (
                        botGuilds.map((guild: any) => (
                          <TableRow key={guild.id}>
                            <TableCell className="font-medium">{guild.name}</TableCell>
                            <TableCell className="font-mono text-sm">{guild.id}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {guild.approximate_member_count || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => confirmLeaveGuild(guild)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Leave
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No servers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Leave Guild Confirmation Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Server?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want the bot to leave <strong>{guildToLeave?.name}</strong>?
              <br /><br />
              The bot will no longer be able to perform any actions in this server until re-invited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGuild}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave Server
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BotManagement;
