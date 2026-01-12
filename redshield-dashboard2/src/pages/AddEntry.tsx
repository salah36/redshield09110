import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type ReasonType } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useAuth";

const AddEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();

  // Fetch guilds for server selection
  const { data: guilds, isLoading: guildsLoading } = useQuery({
    queryKey: ['guilds'],
    queryFn: () => api.getGuilds(),
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    discord_user_id: "",
    license: "",
    reason_type: "" as ReasonType | "",
    reason_text: "",
    proof_url: "",
    server_name: "",
    other_server: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-populate server name for contributors (they only see their linked server)
  useEffect(() => {
    if (user && !user.isOwner && guilds && guilds.length > 0) {
      // Contributors only have access to their linked server
      const serverName = guilds[0].guild_name || guilds[0].guild_id;
      setFormData(prev => ({ ...prev, server_name: serverName }));
    }
  }, [user, guilds]);

  const addEntryMutation = useMutation({
    mutationFn: (data: typeof formData) => api.addBlacklistEntry({
      discord_user_id: data.discord_user_id,
      license: data.license,
      reason_type: data.reason_type as ReasonType,
      reason_text: data.reason_text || undefined,
      proof_url: data.proof_url,
      server_name: data.server_name,
      other_server: data.other_server || undefined,
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Blacklist entry added successfully.",
      });
      navigate("/blacklist");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add blacklist entry.",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.license.trim()) {
      newErrors.license = "License is required";
    }

    if (!formData.discord_user_id.trim()) {
      newErrors.discord_user_id = "Discord User ID is required";
    } else if (!/^\d{17,19}$/.test(formData.discord_user_id)) {
      newErrors.discord_user_id = "Invalid Discord User ID format";
    }

    if (!formData.reason_type) {
      newErrors.reason_type = "Reason type is required";
    }

    if (!formData.proof_url.trim()) {
      newErrors.proof_url = "Proof URL is required";
    } else {
      try {
        new URL(formData.proof_url);
      } catch {
        newErrors.proof_url = "Invalid URL format";
      }
    }

    if (!formData.server_name.trim()) {
      newErrors.server_name = "Server name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      addEntryMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Blacklist Entry
            </CardTitle>
            <CardDescription>Add a new user to the blacklist system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="license">
                  License <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="license"
                  placeholder="e.g., license:abc123..."
                  value={formData.license}
                  onChange={(e) => handleInputChange('license', e.target.value)}
                  className={errors.license ? "border-destructive" : ""}
                />
                {errors.license && (
                  <p className="text-sm text-destructive">{errors.license}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord_user_id">
                  Discord User ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discord_user_id"
                  placeholder="e.g., 123456789012345678"
                  value={formData.discord_user_id}
                  onChange={(e) => handleInputChange('discord_user_id', e.target.value)}
                  className={errors.discord_user_id ? "border-destructive" : ""}
                />
                {errors.discord_user_id && (
                  <p className="text-sm text-destructive">{errors.discord_user_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason_type">
                  Reason Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.reason_type}
                  onValueChange={(value) => handleInputChange('reason_type', value)}
                >
                  <SelectTrigger className={errors.reason_type ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select reason type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHEAT">Cheat</SelectItem>
                    <SelectItem value="GLITCH">Glitch Abuse</SelectItem>
                    <SelectItem value="DUPLICATE">Duplicate Account</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.reason_type && (
                  <p className="text-sm text-destructive">{errors.reason_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof_url">
                  Proof URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="proof_url"
                  type="url"
                  placeholder="https://example.com/proof.png"
                  value={formData.proof_url}
                  onChange={(e) => handleInputChange('proof_url', e.target.value)}
                  className={errors.proof_url ? "border-destructive" : ""}
                />
                {errors.proof_url && (
                  <p className="text-sm text-destructive">{errors.proof_url}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Provide a link to evidence (screenshot, video, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="server_name">
                  Server Name <span className="text-destructive">*</span>
                </Label>
                {guildsLoading ? (
                  <Input disabled value="Loading servers..." />
                ) : user?.isOwner ? (
                  // Owner: Show dropdown with all guilds
                  <Select
                    value={formData.server_name}
                    onValueChange={(value) => handleInputChange('server_name', value)}
                  >
                    <SelectTrigger className={errors.server_name ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select server" />
                    </SelectTrigger>
                    <SelectContent>
                      {guilds && guilds.length > 0 ? (
                        guilds.map((guild) => (
                          <SelectItem key={guild.guild_id} value={guild.guild_name}>
                            {guild.guild_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No servers available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  // Contributor: Show their linked server only (read-only)
                  <Input
                    id="server_name"
                    value={formData.server_name || (guilds && guilds.length > 0 ? guilds[0].guild_name : "Loading...")}
                    disabled
                    className="bg-muted"
                  />
                )}
                {errors.server_name && (
                  <p className="text-sm text-destructive">{errors.server_name}</p>
                )}
                {!user?.isOwner && (
                  <p className="text-xs text-muted-foreground">
                    You can only add entries for your linked server
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/blacklist")}
                  disabled={addEntryMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={addEntryMutation.isPending}
                >
                  {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddEntry;
