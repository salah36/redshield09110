import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, ArrowLeft, Search, Filter, Ban, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { api, type BlacklistFilters, type ReasonType, type EntryStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useAuth";

const Blacklist = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<BlacklistFilters>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['blacklist', filters],
    queryFn: () => api.getBlacklist(filters),
  });

  const handleRevokeEntry = async (id: string) => {
    try {
      await api.revokeBlacklistEntry(id);
      toast({
        title: "Entry Revoked",
        description: "Blacklist entry has been revoked successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      await api.deleteBlacklistEntry(entryToDelete);
      toast({
        title: "Entry Deleted",
        description: "Blacklist entry has been permanently deleted from the database.",
      });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleFilterChange = (key: keyof BlacklistFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page on filter change
    }));
    setPage(1);
  };

  const getReasonBadgeColor = (reason: ReasonType) => {
    switch (reason) {
      case 'CHEAT': return 'destructive';
      case 'GLITCH': return 'default';
      case 'DUPLICATE': return 'secondary';
      case 'OTHER': return 'outline';
      default: return 'default';
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
            <CardTitle>Blacklist Management</CardTitle>
            <CardDescription>
              View and manage blacklisted users. {user?.isOwner ? "As owner, you can revoke or permanently delete entries." : "You can view all entries and owners can manage them."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by license..."
                    className="pl-8"
                    value={filters.license || ''}
                    onChange={(e) => handleFilterChange('license', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Search by Discord ID..."
                  value={filters.discord_user_id || ''}
                  onChange={(e) => handleFilterChange('discord_user_id', e.target.value)}
                />
              </div>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value as EntryStatus)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="REVOKED">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.reason_type || 'all'}
                onValueChange={(value) => handleFilterChange('reason_type', value === 'all' ? undefined : value as ReasonType)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reasons</SelectItem>
                  <SelectItem value="CHEAT">Cheat</SelectItem>
                  <SelectItem value="GLITCH">Glitch</SelectItem>
                  <SelectItem value="DUPLICATE">Duplicate</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading blacklist...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Error loading blacklist. Please try again.
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License</TableHead>
                        <TableHead>Discord ID</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Server</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-mono text-sm">{entry.license}</TableCell>
                          <TableCell className="font-mono text-sm">{entry.discord_user_id || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getReasonBadgeColor(entry.reason_type)}>
                              {entry.reason_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.server_name}</TableCell>
                          <TableCell>
                            {entry.status === 'ACTIVE' ? (
                              <Badge variant="destructive">
                                <Ban className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Revoked
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {entry.status === 'ACTIVE' && user?.isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevokeEntry(entry.id)}
                                >
                                  Revoke
                                </Button>
                              )}
                              {user?.isOwner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => confirmDelete(entry.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page === 1}
                      onClick={() => {
                        const newPage = data.pagination.page - 1;
                        setPage(newPage);
                        setFilters(prev => ({ ...prev, page: newPage }));
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={data.pagination.page >= data.pagination.pages}
                      onClick={() => {
                        const newPage = data.pagination.page + 1;
                        setPage(newPage);
                        setFilters(prev => ({ ...prev, page: newPage }));
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No blacklist entries found
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blacklist entry from the database.
              <br /><br />
              <strong>Note:</strong> Consider using "Revoke" instead if you want to keep a record of the entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Blacklist;
