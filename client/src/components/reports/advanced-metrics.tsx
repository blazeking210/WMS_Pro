import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  BarChart3,
  Activity,
  Target
} from "lucide-react";

interface AdvancedMetricsProps {
  data: any;
}

export function AdvancedMetrics({ data }: AdvancedMetricsProps) {
  if (!data) return null;

  const { metrics, inventory, movements, zones } = data;

  // Calculate additional metrics
  const totalMovements = movements?.length || 0;
  const inMovements = movements?.filter((m: any) => m.type === 'IN').length || 0;
  const outMovements = movements?.filter((m: any) => m.type === 'OUT').length || 0;
  const movementRatio = totalMovements > 0 ? (inMovements / totalMovements * 100) : 0;

  const avgStockLevel = inventory?.length > 0 
    ? inventory.reduce((sum: number, item: any) => sum + item.currentStock, 0) / inventory.length 
    : 0;

  const stockTurnover = inventory?.length > 0
    ? movements?.length / inventory.length
    : 0;

  const zoneUtilization = zones?.length > 0
    ? zones.reduce((sum: number, zone: any) => sum + (zone.itemCount || 0), 0) / zones.length
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Inventory Value</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            ${(metrics?.totalValue || 0).toLocaleString()}
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Movement Ratio</CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {movementRatio.toFixed(1)}%
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">
              {inMovements} IN / {outMovements} OUT
            </span>
          </div>
          <Progress value={movementRatio} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Stock Level</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {avgStockLevel.toFixed(0)}
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">units per product</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Stock Turnover</CardTitle>
            <Target className="h-5 w-5 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stockTurnover.toFixed(1)}x
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">movements per product</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Zone Utilization</CardTitle>
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {zoneUtilization.toFixed(1)}
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">avg items per zone</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Alerts</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {(metrics?.lowStockItems || 0) + (metrics?.outOfStockItems || 0)}
          </div>
          <div className="flex items-center mt-2 space-x-2">
            <Badge variant="destructive" className="text-xs">
              {metrics?.outOfStockItems || 0} out
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {metrics?.lowStockItems || 0} low
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Total Movements</CardTitle>
            <TrendingUp className="h-5 w-5 text-cyan-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {totalMovements.toLocaleString()}
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">
              in selected period
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">Active Zones</CardTitle>
            <Package className="h-5 w-5 text-teal-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {zones?.length || 0}
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600">
              zones configured
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}