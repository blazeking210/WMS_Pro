import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import MetricsCard from "@/components/metrics-card";
import ActivityItem from "@/components/activity-item";
import ZoneStatus from "@/components/zone-status";
import InventoryTable from "@/components/inventory-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: metrics, isLoading: metricsLoading, error } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || metricsLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (!metrics) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
              <p className="text-gray-600">Please try refreshing the page</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {/* Low Stock Alert */}
          {metrics.lowStockItems > 0 && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <TriangleAlert className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Low Stock Alert:</strong> {metrics.lowStockItems} items are below minimum stock levels.
              </AlertDescription>
            </Alert>
          )}

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Total Items"
              value={metrics.totalItems}
              icon="package"
              trend={{ value: 12.5, isPositive: true }}
            />
            <MetricsCard
              title="Low Stock Items"
              value={metrics.lowStockItems}
              icon="warning"
              trend={{ value: -2, isPositive: true }}
              variant="warning"
            />
            <MetricsCard
              title="Out of Stock"
              value={metrics.outOfStockItems}
              icon="alert"
              trend={{ value: 3, isPositive: false }}
              variant="danger"
            />
            <MetricsCard
              title="Total Value"
              value={`$${Math.round(metrics.totalValue / 1000)}K`}
              icon="dollar"
              trend={{ value: 8.2, isPositive: true }}
              variant="success"
            />
          </div>

          {/* Recent Activity & Zone Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-history mr-2"></i>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentActivities.length > 0 ? (
                    metrics.recentActivities.map((activity) => (
                      <ActivityItem key={activity.id} movement={activity} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Zone Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  Zone Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.zoneStatus.length > 0 ? (
                    metrics.zoneStatus.map((zone) => (
                      <ZoneStatus key={zone.id} zone={zone} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No zones configured</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <InventoryTable />
        </main>
      </div>
    </div>
  );
}
