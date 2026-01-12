import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, Link2, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ServerLinking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => api.getDashboardUsers(),
  });

  const updateLinkMutation = useMutation({
    mutationFn: ({ userId, serverId }: { userId: string; serverId: string | null }) =>
      api.updateUserServerLink(userId, serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      toast({
        title: "Success",
        description: "Server link updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update server link.",
        variant: "destructive",
      });
    },
  });

  const handleServerLinkChange = (userId: string, serverId: string) => {
    updateLinkMutation.mutate({
      userId,
      serverId: serverId.trim() || null,
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
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Server Linking
            </CardTitle>
            <CardDescription>Link dashboard users to specific servers (Owner Only)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading users...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading users. Please try again.
              </div>
            ) : users && users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Server Link</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.discord_user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.avatar}.png`}
                                alt={user.username}
                              />
                              <AvatarFallback>{user.username[0]}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.linked_server_id ? (
                            <span className="font-mono text-sm">{user.linked_server_id}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Enter server ID..."
                              defaultValue={user.linked_server_id || ''}
                              onBlur={(e) => {
                                if (e.target.value !== (user.linked_server_id || '')) {
                                  handleServerLinkChange(user.discord_user_id, e.target.value);
                                }
                              }}
                              className="w-[200px]"
                            />
                            {user.linked_server_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleServerLinkChange(user.discord_user_id, '')}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ServerLinking;
