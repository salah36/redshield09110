import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, ArrowLeft, TrendingUp, Users, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const EnhancedStats = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['enhanced-stats'],
    queryFn: () => api.getEnhancedStats(),
  });

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
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Enhanced Statistics</h2>
          <p className="text-muted-foreground">Advanced analytics and insights (Owner Only)</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
            <span className="ml-2 text-muted-foreground">Loading statistics...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">
            Error loading statistics. Please try again.
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Blacklist Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Blacklist Statistics</CardTitle>
                <CardDescription>Overview of all blacklist entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">{stats.blacklist.total}</div>
                    <div className="text-sm text-muted-foreground">Total Entries</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-destructive">{stats.blacklist.active}</div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-500">{stats.blacklist.revoked}</div>
                    <div className="text-sm text-muted-foreground">Revoked</div>
                  </div>
                </div>

                {stats.blacklist.by_reason && Object.keys(stats.blacklist.by_reason).length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">By Reason Type</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(stats.blacklist.by_reason).map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between p-3 rounded-lg border">
                          <span className="font-medium">{reason}</span>
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dashboard Users Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Users</CardTitle>
                <CardDescription>Active users and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="text-2xl font-bold">{stats.dashboard_users.total}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="text-2xl font-bold text-green-500">{stats.dashboard_users.online}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Online Now</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <div className="text-2xl font-bold">{stats.dashboard_users.offline}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Offline</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Protected Servers</CardTitle>
                <CardDescription>Discord servers using RedShield</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.guilds.total}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Total Servers</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default EnhancedStats;
