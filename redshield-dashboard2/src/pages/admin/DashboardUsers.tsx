import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, Users, Circle, MoreHorizontal, Ban, UserX, Edit, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const DashboardUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editRoleDialog, setEditRoleDialog] = useState<{ open: boolean; user: any | null }>({ open: false, user: null });
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; user: any | null }>({ open: false, action: "", user: null });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => api.getDashboardUsers(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      toast({ title: "Success", description: "User role updated successfully" });
      setEditRoleDialog({ open: false, user: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role", variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      api.banUser(userId, banned),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      toast({
        title: "Success",
        description: variables.banned ? "User banned successfully" : "User unbanned successfully"
      });
      setConfirmDialog({ open: false, action: "", user: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ban status", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      toast({ title: "Success", description: "User deleted successfully" });
      setConfirmDialog({ open: false, action: "", user: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
    },
  });

  const revokeLicenseMutation = useMutation({
    mutationFn: (userId: string) => api.revokeUserLicense(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
      toast({ title: "Success", description: "License revoked successfully" });
      setConfirmDialog({ open: false, action: "", user: null });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to revoke license", variant: "destructive" });
    },
  });

  const isOnline = (lastSeen: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  const handleEditRole = (user: any) => {
    setSelectedRole(user.role);
    setEditRoleDialog({ open: true, user });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.user) return;

    switch (confirmDialog.action) {
      case "ban":
        banUserMutation.mutate({ userId: confirmDialog.user.discord_user_id, banned: true });
        break;
      case "unban":
        banUserMutation.mutate({ userId: confirmDialog.user.discord_user_id, banned: false });
        break;
      case "delete":
        deleteUserMutation.mutate(confirmDialog.user.discord_user_id);
        break;
      case "revoke":
        revokeLicenseMutation.mutate(confirmDialog.user.discord_user_id);
        break;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER': return 'default';
      case 'CONTRIBUTOR': return 'secondary';
      default: return 'outline';
    }
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
                      <TableHead>Active</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.discord_user_id} className={!user.is_active ? "opacity-50" : ""}>
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
                          <Badge variant={getRoleBadgeVariant(user.role)}>
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
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "Active" : "Banned"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.last_seen).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditRole(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              {user.is_active ? (
                                <DropdownMenuItem
                                  onClick={() => setConfirmDialog({ open: true, action: "ban", user })}
                                  className="text-orange-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Ban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setConfirmDialog({ open: true, action: "unban", user })}
                                  className="text-green-600"
                                >
                                  <UserX className="mr-2 h-4 w-4" />
                                  Unban User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, action: "revoke", user })}
                                className="text-yellow-600"
                              >
                                <KeyRound className="mr-2 h-4 w-4" />
                                Revoke License
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setConfirmDialog({ open: true, action: "delete", user })}
                                className="text-destructive"
                                disabled={user.role === 'OWNER'}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog.open} onOpenChange={(open) => setEditRoleDialog({ open, user: open ? editRoleDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {editRoleDialog.user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNER">OWNER</SelectItem>
                  <SelectItem value="CONTRIBUTOR">CONTRIBUTOR</SelectItem>
                  <SelectItem value="SERVER_ADMIN">SERVER_ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editRoleDialog.user && selectedRole) {
                  updateRoleMutation.mutate({ userId: editRoleDialog.user.discord_user_id, role: selectedRole });
                }
              }}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, action: open ? confirmDialog.action : "", user: open ? confirmDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "ban" && "Ban User"}
              {confirmDialog.action === "unban" && "Unban User"}
              {confirmDialog.action === "delete" && "Delete User"}
              {confirmDialog.action === "revoke" && "Revoke License"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "ban" && `Are you sure you want to ban ${confirmDialog.user?.username}? They will not be able to access the dashboard.`}
              {confirmDialog.action === "unban" && `Are you sure you want to unban ${confirmDialog.user?.username}? They will regain access to the dashboard.`}
              {confirmDialog.action === "delete" && `Are you sure you want to delete ${confirmDialog.user?.username}? This action cannot be undone.`}
              {confirmDialog.action === "revoke" && `Are you sure you want to revoke the license for ${confirmDialog.user?.username}? Their access will be removed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, action: "", user: null })}>
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action === "unban" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={banUserMutation.isPending || deleteUserMutation.isPending || revokeLicenseMutation.isPending}
            >
              {(banUserMutation.isPending || deleteUserMutation.isPending || revokeLicenseMutation.isPending) ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardUsers;
