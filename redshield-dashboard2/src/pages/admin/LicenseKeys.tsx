import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Key,
  Plus,
  Copy,
  Trash2,
  Ban,
  Check,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useLicenseKeys,
  useLicenseKeyStats,
  useGenerateLicenseKey,
  useGenerateLicenseKeysBatch,
  useDeleteLicenseKey,
  useRevokeLicenseKey,
} from "@/hooks/useLicenseKeys";
import type { LicenseKeyStatus } from "@/lib/api";

const DURATION_OPTIONS = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
  { value: 180, label: "180 Days" },
  { value: 365, label: "1 Year" },
  { value: -1, label: "Custom" },
];

const LicenseKeys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<LicenseKeyStatus | "ALL">("ALL");

  // State for generate dialogs
  const [generateOpen, setGenerateOpen] = useState(false);
  const [batchGenerateOpen, setBatchGenerateOpen] = useState(false);
  const [generateDuration, setGenerateDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [generateNotes, setGenerateNotes] = useState("");
  const [batchCount, setBatchCount] = useState(5);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [showGeneratedKeys, setShowGeneratedKeys] = useState(false);

  // Get actual duration value (custom or preset)
  const getActualDuration = () => isCustomDuration ? customDuration : generateDuration;

  // Queries and mutations
  const {
    data: licenseKeysData,
    isLoading,
    error,
    refetch,
  } = useLicenseKeys({
    page,
    limit: 15,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const { data: stats, isLoading: statsLoading } = useLicenseKeyStats();
  const generateMutation = useGenerateLicenseKey();
  const batchGenerateMutation = useGenerateLicenseKeysBatch();
  const deleteMutation = useDeleteLicenseKey();
  const revokeMutation = useRevokeLicenseKey();

  const handleGenerateKey = async () => {
    const duration = getActualDuration();
    if (duration < 1) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be at least 1 day",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await generateMutation.mutateAsync({
        duration_days: duration,
        notes: generateNotes || undefined,
      });
      setGeneratedKeys([result.license_key]);
      setShowGeneratedKeys(true);
      setGenerateOpen(false);
      setGenerateNotes("");
      setIsCustomDuration(false);
      toast({
        title: "License Key Generated",
        description: "New license key has been created successfully.",
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate license key",
        variant: "destructive",
      });
    }
  };

  const handleBatchGenerate = async () => {
    const duration = getActualDuration();
    if (duration < 1) {
      toast({
        title: "Invalid Duration",
        description: "Duration must be at least 1 day",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await batchGenerateMutation.mutateAsync({
        count: batchCount,
        duration_days: duration,
        notes: generateNotes || undefined,
      });
      setGeneratedKeys(result.keys.map((k) => k.license_key));
      setShowGeneratedKeys(true);
      setBatchGenerateOpen(false);
      setGenerateNotes("");
      setIsCustomDuration(false);
      toast({
        title: "License Keys Generated",
        description: `${result.keys.length} license keys have been created successfully.`,
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Failed to generate license keys",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "License Key Deleted",
        description: "The license key has been permanently deleted.",
      });
    } catch (err) {
      toast({
        title: "Deletion Failed",
        description: err instanceof Error ? err.message : "Failed to delete license key",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeMutation.mutateAsync(id);
      toast({
        title: "License Key Revoked",
        description: "The license key has been revoked and can no longer be used.",
      });
    } catch (err) {
      toast({
        title: "Revocation Failed",
        description: err instanceof Error ? err.message : "Failed to revoke license key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "License key copied to clipboard",
    });
  };

  const copyAllKeys = () => {
    navigator.clipboard.writeText(generatedKeys.join("\n"));
    toast({
      title: "Copied",
      description: `${generatedKeys.length} license key(s) copied to clipboard`,
    });
  };

  const getStatusBadge = (status: LicenseKeyStatus) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "CLAIMED":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Claimed</Badge>;
      case "EXPIRED":
        return <Badge variant="secondary">Expired</Badge>;
      case "REVOKED":
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

      <main className="container py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.total_generated || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {statsLoading ? "..." : stats?.by_status?.ACTIVE || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Claimed</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {statsLoading ? "..." : stats?.by_status?.CLAIMED || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.claimed_this_week || 0}
              </div>
              <p className="text-xs text-muted-foreground">Claims</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  License Keys Management
                </CardTitle>
                <CardDescription>
                  Generate and manage subscription license keys (Owner Only)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate License Key</DialogTitle>
                      <DialogDescription>
                        Create a new license key with the specified duration.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Select
                          value={isCustomDuration ? "-1" : generateDuration.toString()}
                          onValueChange={(v) => {
                            if (v === "-1") {
                              setIsCustomDuration(true);
                            } else {
                              setIsCustomDuration(false);
                              setGenerateDuration(parseInt(v));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isCustomDuration && (
                        <div className="grid gap-2">
                          <Label htmlFor="customDuration">Custom Duration (days)</Label>
                          <Input
                            id="customDuration"
                            type="number"
                            min={1}
                            max={3650}
                            value={customDuration}
                            onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                            placeholder="Enter days..."
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add notes for this key..."
                          value={generateNotes}
                          onChange={(e) => setGenerateNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleGenerateKey}
                        disabled={generateMutation.isLoading}
                      >
                        {generateMutation.isLoading ? "Generating..." : "Generate"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={batchGenerateOpen} onOpenChange={setBatchGenerateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Batch Generate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Batch Generate License Keys</DialogTitle>
                      <DialogDescription>
                        Create multiple license keys at once (max 50).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="count">Number of Keys</Label>
                        <Input
                          id="count"
                          type="number"
                          min={1}
                          max={50}
                          value={batchCount}
                          onChange={(e) =>
                            setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="batch-duration">Duration</Label>
                        <Select
                          value={isCustomDuration ? "-1" : generateDuration.toString()}
                          onValueChange={(v) => {
                            if (v === "-1") {
                              setIsCustomDuration(true);
                            } else {
                              setIsCustomDuration(false);
                              setGenerateDuration(parseInt(v));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {DURATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value.toString()}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {isCustomDuration && (
                        <div className="grid gap-2">
                          <Label htmlFor="batchCustomDuration">Custom Duration (days)</Label>
                          <Input
                            id="batchCustomDuration"
                            type="number"
                            min={1}
                            max={3650}
                            value={customDuration}
                            onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                            placeholder="Enter days..."
                          />
                        </div>
                      )}
                      <div className="grid gap-2">
                        <Label htmlFor="batch-notes">Notes (optional)</Label>
                        <Textarea
                          id="batch-notes"
                          placeholder="Add notes for these keys..."
                          value={generateNotes}
                          onChange={(e) => setGenerateNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleBatchGenerate}
                        disabled={batchGenerateMutation.isLoading}
                      >
                        {batchGenerateMutation.isLoading
                          ? "Generating..."
                          : `Generate ${batchCount} Keys`}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as LicenseKeyStatus | "ALL");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CLAIMED">Claimed</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Shield className="w-8 h-8 text-primary animate-pulse" />
                <span className="ml-2 text-muted-foreground">Loading license keys...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                Error loading license keys. Please try again.
              </div>
            ) : licenseKeysData && licenseKeysData.data.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Key</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Claimed By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licenseKeysData.data.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-sm bg-muted px-2 py-1 rounded">
                                {key.license_key}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(key.license_key)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(key.status)}</TableCell>
                          <TableCell>{key.duration_days} days</TableCell>
                          <TableCell>
                            {key.claimed_by ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={`https://cdn.discordapp.com/avatars/${key.claimed_by}/${key.claimed_by_avatar}.png`}
                                    alt={key.claimed_by_username || "User"}
                                  />
                                  <AvatarFallback>
                                    {key.claimed_by_username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {key.claimed_by_username || key.claimed_by}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(key.expires_at)}</TableCell>
                          <TableCell>{formatDate(key.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {(key.status === "ACTIVE" || key.status === "CLAIMED") && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Ban className="h-4 w-4 text-orange-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke License Key?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will revoke the license key and prevent it from being
                                        used. If already claimed, the user will lose access.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleRevoke(key.id)}
                                        className="bg-orange-500 hover:bg-orange-600"
                                      >
                                        Revoke
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete License Key?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. The license key will be
                                      permanently deleted from the system.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(key.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {licenseKeysData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * 15 + 1} to{" "}
                      {Math.min(page * 15, licenseKeysData.pagination.total)} of{" "}
                      {licenseKeysData.pagination.total} keys
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {page} of {licenseKeysData.pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPage((p) => Math.min(licenseKeysData.pagination.pages, p + 1))
                        }
                        disabled={page === licenseKeysData.pagination.pages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No license keys found</p>
                <p className="text-sm mt-1">Generate your first license key to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Keys Dialog */}
        <Dialog open={showGeneratedKeys} onOpenChange={setShowGeneratedKeys}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Keys Generated Successfully
              </DialogTitle>
              <DialogDescription>
                {generatedKeys.length === 1
                  ? "Your license key has been created."
                  : `${generatedKeys.length} license keys have been created.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generatedKeys.map((key, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                >
                  <code className="text-sm">{key}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(key)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              {generatedKeys.length > 1 && (
                <Button variant="outline" onClick={copyAllKeys}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All
                </Button>
              )}
              <Button onClick={() => setShowGeneratedKeys(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LicenseKeys;
