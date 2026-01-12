import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  Key,
  Check,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMyLicense, useClaimLicenseKey } from "@/hooks/useLicenseKeys";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatTimeRemainingFull } from "@/lib/timeUtils";

const ClaimLicense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: user } = useCurrentUser();

  const [licenseKey, setLicenseKey] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { data: myLicense, isLoading: licenseLoading, refetch: refetchLicense } = useMyLicense();
  const claimMutation = useClaimLicenseKey();

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(false);

    // Validate format (case-insensitive)
    const keyFormat = /^redshield-[a-z0-9]{5}-[a-z0-9]{5}-[a-z0-9]{5}$/i;
    if (!keyFormat.test(licenseKey.trim())) {
      setClaimError("Invalid license key format. Expected format: RedShield-XXXXX-XXXXX-XXXXX");
      return;
    }

    try {
      await claimMutation.mutateAsync(licenseKey.trim().toUpperCase());
      setClaimSuccess(true);
      setLicenseKey("");
      refetchLicense();
      toast({
        title: "License Claimed!",
        description: "Your license has been successfully activated. Welcome to RedShield!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to claim license key";
      setClaimError(errorMessage);
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = () => {
    if (!myLicense?.has_license || !myLicense.license) {
      return null;
    }

    const license = myLicense.license;

    if (license.is_active && license.expires_at) {
      return {
        variant: "success" as const,
        icon: Check,
        title: "Active License",
        description: `Your license is active with ${formatTimeRemainingFull(license.expires_at)} remaining.`,
      };
    }

    if (license.status === "EXPIRED") {
      return {
        variant: "warning" as const,
        icon: Clock,
        title: "License Expired",
        description: "Your license has expired. Claim a new license key to continue access.",
      };
    }

    if (license.status === "REVOKED") {
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        title: "License Revoked",
        description: "Your license has been revoked. Please contact an administrator.",
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-orbitron font-bold text-xl">
              Red<span className="text-primary">Shield</span>
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Claim License</h2>
            <p className="text-muted-foreground">
              Claim a license key to gain access to RedShield features
            </p>
          </div>

          {/* Current License Status */}
          {licenseLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground">Checking license status...</span>
              </CardContent>
            </Card>
          ) : myLicense?.has_license && myLicense.license ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Your License
                </CardTitle>
                <CardDescription>Current license information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusInfo && (
                  <Alert
                    variant={statusInfo.variant === "destructive" ? "destructive" : "default"}
                    className={
                      statusInfo.variant === "success"
                        ? "border-green-500 bg-green-500/10"
                        : statusInfo.variant === "warning"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : ""
                    }
                  >
                    <statusInfo.icon
                      className={`h-4 w-4 ${
                        statusInfo.variant === "success"
                          ? "text-green-500"
                          : statusInfo.variant === "warning"
                            ? "text-yellow-500"
                            : ""
                      }`}
                    />
                    <AlertTitle>{statusInfo.title}</AlertTitle>
                    <AlertDescription>{statusInfo.description}</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">License Key</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded block">
                      {myLicense.license.license_key}
                    </code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        myLicense.license.is_active
                          ? "default"
                          : myLicense.license.status === "EXPIRED"
                            ? "secondary"
                            : "destructive"
                      }
                      className={myLicense.license.is_active ? "bg-green-500" : ""}
                    >
                      {myLicense.license.is_active
                        ? "Active"
                        : myLicense.license.status === "EXPIRED"
                          ? "Expired"
                          : myLicense.license.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {myLicense.license.duration_days} days
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Claimed On</p>
                    <p className="text-sm font-medium">
                      {formatDate(myLicense.license.claimed_at)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Expires On</p>
                    <p className="text-sm font-medium">
                      {formatDate(myLicense.license.expires_at)}
                    </p>
                  </div>
                  {myLicense.license.is_active && myLicense.license.expires_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="text-sm font-medium text-green-500">
                        {formatTimeRemainingFull(myLicense.license.expires_at)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Claim License Form */}
          {(!myLicense?.has_license ||
            !myLicense.license?.is_active ||
            myLicense.license.status === "EXPIRED") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  {myLicense?.license?.status === "EXPIRED"
                    ? "Renew Your License"
                    : "Claim License Key"}
                </CardTitle>
                <CardDescription>
                  {myLicense?.license?.status === "EXPIRED"
                    ? "Your previous license has expired. Enter a new license key to renew access."
                    : "Enter your license key to activate your RedShield subscription"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleClaim} className="space-y-4">
                  {claimError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{claimError}</AlertDescription>
                    </Alert>
                  )}

                  {claimSuccess && (
                    <Alert className="border-green-500 bg-green-500/10">
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertTitle className="text-green-500">Success!</AlertTitle>
                      <AlertDescription>
                        Your license has been successfully claimed. You now have access to
                        RedShield contributor features.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="license-key">License Key</Label>
                    <Input
                      id="license-key"
                      type="text"
                      placeholder="RedShield-XXXXX-XXXXX-XXXXX"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      className="font-mono"
                      disabled={claimMutation.isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the license key you received. Format: RedShield-XXXXX-XXXXX-XXXXX
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!licenseKey.trim() || claimMutation.isLoading}
                  >
                    {claimMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Claim License
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">What happens when you claim a license?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    You will be granted the <strong>Contributor</strong> role with access to
                    dashboard features
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>
                    Your license will be active for the duration specified by the license key
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Each license key can only be claimed once</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>When your license expires, you will need to claim a new key</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClaimLicense;
