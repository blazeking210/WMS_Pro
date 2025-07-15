import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Package, AlertTriangle, Download, FileText, BarChart, Table } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useSettings } from "@/hooks/useSettings";

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: userSettings } = useSettings();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["/api/reports/data"],
    queryFn: async () => {
      const response = await fetch(`/api/reports/data`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch report data');
      return response.json();
    },
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

  if (isLoading || metricsLoading || reportLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/reports/export/excel', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to export Excel report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warehouse_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Excel report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export Excel report",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/reports/export/pdf', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to export PDF report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `warehouse_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "PDF report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Advanced Reports & Analytics</h2>
              <p className="text-gray-600 mt-1">Comprehensive warehouse performance insights and detailed reports</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed View</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Inventory</CardTitle>
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{reportData?.metrics?.totalItems || 0}</div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">Active</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Inventory Value</CardTitle>
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Math.round((reportData?.metrics?.totalValue || 0) / 1000), userSettings)}K
                    </div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-medium">Total Value</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Low Stock Alert</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{reportData?.metrics?.lowStockItems || 0}</div>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-yellow-600 font-medium">Items below minimum</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">Out of Stock</CardTitle>
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{reportData?.metrics?.outOfStockItems || 0}</div>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-red-600 font-medium">Items out of stock</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData?.inventory?.slice(0, 10).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.productId}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.currentStock}</div>
                            <div className="text-sm text-gray-500">{formatCurrency(item.unitPrice || 0, userSettings)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Movements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData?.movements?.slice(0, 10).map((movement: any) => (
                        <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{movement.product?.name}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(movement.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.type} {movement.quantity}
                            </div>
                            <div className="text-sm text-gray-500">{movement.newStock} total</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Zone Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData?.zones?.map((zone: any) => (
                        <div key={zone.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="font-medium">{zone.name}</div>
                            <div className="text-sm text-gray-500">{zone.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{zone.itemCount || 0}</div>
                            <div className="text-sm text-gray-500">items</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData?.lowStockItems?.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded border-yellow-200">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.productId}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-yellow-600">{item.currentStock}</div>
                            <div className="text-sm text-gray-500">min: {item.minStock}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <span className="font-bold">{reportData?.metrics?.totalItems || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Value:</span>
                        <span className="font-bold">{formatCurrency(reportData?.metrics?.totalValue || 0, userSettings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock:</span>
                        <span className="font-bold text-yellow-600">{reportData?.metrics?.lowStockItems || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Out of Stock:</span>
                        <span className="font-bold text-red-600">{reportData?.metrics?.outOfStockItems || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Movements:</span>
                        <span className="font-bold">{reportData?.movements?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
