import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useAuth";
import { Shield, Users, Server, AlertTriangle, TrendingUp, Bot, Key, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { formatTimeRemaining, formatTimeRemainingFull } from "@/lib/timeUtils";

const Dashboard = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  const navigate = useNavigate();

  // Fetch stats data
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
    enabled: !!user, // Only fetch if user is logged in
  });

  useEffect(() => {
    // Redirect to home if not authenticated or not a contributor
    if (!isLoading && (!user || (!user.isContributor && !user.isOwner))) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-16 h-16 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-orbitron font-bold text-xl">
              Red<span className="text-primary">Shield</span> Dashboard
            </h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.username}!
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant={user.isOwner ? "default" : "secondary"}>
                  {user.isOwner ? "Owner" : "Contributor"}
                </Badge>
                {user.license?.is_active && user.license.expires_at && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeRemaining(user.license.expires_at)} remaining
                  </Badge>
                )}
              </div>
            </div>

            {/* License Status Card */}
            {!user.isOwner && user.license && (
              <Card className={`w-full md:w-80 ${user.license.is_active ? 'border-green-500/50' : 'border-destructive/50'}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    License Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.license.is_active ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span className="text-sm font-medium">
                          {new Date(user.license.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Progress
                        value={(user.license.days_remaining / user.license.duration_days) * 100}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeRemainingFull(user.license.expires_at)} remaining
                      </p>
                    </>
                  ) : (
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-sm text-destructive font-medium">License Expired</p>
                      <Button size="sm" className="mt-2" onClick={() => navigate("/claim-license")}>
                        Claim New License
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Blacklist</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.blacklist.total ?? '---'}</div>
              <p className="text-xs text-muted-foreground">All entries</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Entries</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.blacklist.active ?? '---'}</div>
              <p className="text-xs text-muted-foreground">Currently blacklisted</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protected Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.guilds.total ?? '---'}</div>
              <p className="text-xs text-muted-foreground">Discord servers</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.blacklist.recentWeek ?? '---'}</div>
              <p className="text-xs text-muted-foreground">New entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your RedShield system from here
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button className="h-20" variant="outline" onClick={() => navigate("/blacklist")}>
              <div className="flex flex-col items-center gap-2">
                <Users className="h-6 w-6" />
                <span>View Blacklist</span>
              </div>
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate("/servers")}>
              <div className="flex flex-col items-center gap-2">
                <Server className="h-6 w-6" />
                <span>Manage Servers</span>
              </div>
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate("/blacklist/add")}>
              <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span>Add Entry</span>
              </div>
            </Button>
            <Button className="h-20" variant="outline" onClick={() => navigate("/claim-license")}>
              <div className="flex flex-col items-center gap-2">
                <Key className="h-6 w-6" />
                <span>Claim License</span>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Owner-Only Section */}
        {user.isOwner && (
          <Card className="mt-6 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Owner Controls
              </CardTitle>
              <CardDescription>
                Additional controls available only to the system owner
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/users")}>
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Dashboard Users</span>
                </div>
              </Button>
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/server-linking")}>
                <div className="flex flex-col items-center gap-2">
                  <Server className="h-6 w-6" />
                  <span>Server Linking</span>
                </div>
              </Button>
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/stats")}>
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Enhanced Stats</span>
                </div>
              </Button>
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/trusted-partners")}>
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>Trusted Partners</span>
                </div>
              </Button>
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/bot-management")}>
                <div className="flex flex-col items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  <span>Bot Management</span>
                </div>
              </Button>
              <Button className="h-20" variant="outline" onClick={() => navigate("/admin/license-keys")}>
                <div className="flex flex-col items-center gap-2">
                  <Key className="h-6 w-6 text-primary" />
                  <span>License Keys</span>
                </div>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
