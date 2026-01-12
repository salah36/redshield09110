import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, ArrowLeft, Users, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, type TrustedPartner } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const TrustedPartners = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TrustedPartner | null>(null);
  const [formData, setFormData] = useState({
    discord_link: "",
    discord_server_id: "",
    server_icon_url: "",
    display_name: "",
    notes: "",
  });

  const { data: partners, isLoading, error } = useQuery({
    queryKey: ['trusted-partners'],
    queryFn: () => api.getTrustedPartners(),
  });

  const addMutation = useMutation({
    mutationFn: (data: { discord_link: string; discord_server_id: string; server_icon_url?: string; display_name: string; notes?: string }) =>
      api.addTrustedPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      toast({
        title: "Success",
        description: "Trusted partner added successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add trusted partner.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ serverId, data }: { serverId: string; data: { discord_link?: string; server_icon_url?: string; display_name?: string; notes?: string } }) =>
      api.updateTrustedPartner(serverId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      toast({
        title: "Success",
        description: "Trusted partner updated successfully.",
      });
      setEditingPartner(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update trusted partner.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serverId: string) => api.deleteTrustedPartner(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-partners'] });
      toast({
        title: "Success",
        description: "Trusted partner removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove trusted partner.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      discord_link: "",
      discord_server_id: "",
      server_icon_url: "",
      display_name: "",
      notes: "",
    });
  };

  const handleAdd = () => {
    if (!formData.discord_link.trim() || !formData.discord_server_id.trim() || !formData.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Discord Link, Server ID, and Display Name are required.",
        variant: "destructive",
      });
      return;
    }

    addMutation.mutate({
      discord_link: formData.discord_link,
      discord_server_id: formData.discord_server_id,
      server_icon_url: formData.server_icon_url || undefined,
      display_name: formData.display_name,
      notes: formData.notes || undefined,
    });
  };

  const handleEdit = (partner: TrustedPartner) => {
    setEditingPartner(partner);
    setFormData({
      discord_link: partner.discord_link,
      discord_server_id: partner.discord_server_id,
      server_icon_url: partner.server_icon_url || "",
      display_name: partner.display_name,
      notes: partner.notes || "",
    });
  };

  const handleUpdate = () => {
    if (!editingPartner) return;

    if (!formData.discord_link.trim() || !formData.display_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Discord Link and Display Name are required.",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      serverId: editingPartner.discord_server_id,
      data: {
        discord_link: formData.discord_link,
        server_icon_url: formData.server_icon_url || undefined,
        display_name: formData.display_name,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleDelete = (serverId: string) => {
    if (confirm("Are you sure you want to remove this trusted partner?")) {
      deleteMutation.mutate(serverId);
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Trusted Partners
                </CardTitle>
                <CardDescription>
                  Manage trusted partners with full Contributor-level access (Owner Only)
                </CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Trusted Partner</DialogTitle>
                    <DialogDescription>
                      Add a new trusted partner with full Contributor access to all servers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="discord_link">Discord Link</Label>
                      <Input
                        id="discord_link"
                        placeholder="discord.gg/xxxxxx"
                        value={formData.discord_link}
                        onChange={(e) => setFormData({ ...formData, discord_link: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord_server_id">Discord Server ID</Label>
                      <Input
                        id="discord_server_id"
                        placeholder="e.g., 123456789012345678"
                        value={formData.discord_server_id}
                        onChange={(e) => setFormData({ ...formData, discord_server_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="server_icon_url">Server Icon URL (Optional)</Label>
                      <Input
                        id="server_icon_url"
                        placeholder="https://cdn.discordapp.com/icons/..."
                        value={formData.server_icon_url}
                        onChange={(e) => setFormData({ ...formData, server_icon_url: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Right-click server icon in Discord → Copy Image Address
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        placeholder="e.g., Marrakech RP"
                        value={formData.display_name}
                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional information..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd} disabled={addMutation.isPending}>
                      {addMutation.isPending ? "Adding..." : "Add Partner"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading trusted partners...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading trusted partners. Please try again.
              </div>
            ) : partners && partners.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server ID</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Discord Link</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners.map((partner) => (
                      <TableRow key={partner.id}>
                        <TableCell className="font-mono text-sm">{partner.discord_server_id}</TableCell>
                        <TableCell>{partner.display_name}</TableCell>
                        <TableCell>
                          <a href={partner.discord_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {partner.discord_link}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {partner.notes || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(partner.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog open={editingPartner?.id === partner.id} onOpenChange={(open) => {
                              if (!open) {
                                setEditingPartner(null);
                                resetForm();
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(partner)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Trusted Partner</DialogTitle>
                                  <DialogDescription>
                                    Update trusted partner information.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_server_id">Discord Server ID</Label>
                                    <Input
                                      id="edit_server_id"
                                      value={formData.discord_server_id}
                                      disabled
                                      className="bg-muted"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_discord_link">Discord Link</Label>
                                    <Input
                                      id="edit_discord_link"
                                      placeholder="discord.gg/xxxxxx"
                                      value={formData.discord_link}
                                      onChange={(e) => setFormData({ ...formData, discord_link: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_server_icon_url">Server Icon URL (Optional)</Label>
                                    <Input
                                      id="edit_server_icon_url"
                                      placeholder="https://cdn.discordapp.com/icons/..."
                                      value={formData.server_icon_url}
                                      onChange={(e) => setFormData({ ...formData, server_icon_url: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Right-click server icon in Discord → Copy Image Address
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_display_name">Display Name</Label>
                                    <Input
                                      id="edit_display_name"
                                      placeholder="e.g., Marrakech RP"
                                      value={formData.display_name}
                                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit_notes">Notes (Optional)</Label>
                                    <Textarea
                                      id="edit_notes"
                                      placeholder="Additional information..."
                                      value={formData.notes}
                                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setEditingPartner(null);
                                    resetForm();
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Updating..." : "Update Partner"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(partner.discord_server_id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No trusted partners found</p>
                <p className="text-sm mt-1">
                  Add partners to grant them full Contributor-level access
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TrustedPartners;
