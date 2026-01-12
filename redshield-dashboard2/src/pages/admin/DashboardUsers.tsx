import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, ArrowLeft, Users, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";

const DashboardUsers = () => {
  const navigate = useNavigate();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => api.getDashboardUsers(),
  });

  const isOnline = (lastSeen: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
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
              <Shield className="w-5 h-5 text-primary" />
              Dashboard Users
            </CardTitle>
            <CardDescription>Manage dashboard user permissions (Owner Only)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading users...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading dashboard users. Please try again.
              </div>
            ) : users && users.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Linked Server</TableHead>
                      <TableHead>Server Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Blacklist</TableHead>
                      <TableHead>Last Seen</TableHead>
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
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {user.discord_user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Circle
                              className={`w-2 h-2 fill-current ${
                                isOnline(user.last_seen) ? 'text-green-500' : 'text-gray-400'
                              }`}
                            />
                            <span className="text-sm">
                              {isOnline(user.last_seen) ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.linked_server_id ? (
                            <span className="font-mono text-sm">{user.linked_server_id}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">No server linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.server_name ? (
                            <span className="text-sm">{user.server_name}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.server_members !== null && user.server_members !== undefined ? (
                            <span className="text-sm">{user.server_members.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.server_blacklist_count !== null && user.server_blacklist_count !== undefined ? (
                            <Badge variant="secondary">{user.server_blacklist_count}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.last_seen).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No dashboard users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardUsers;
