import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface DetailedTablesProps {
  data: any;
}

export function DetailedTables({ data }: DetailedTablesProps) {
  const [currentPage, setCurrentPage] = useState({
    inventory: 1,
    movements: 1,
    lowStock: 1,
  });

  const pageSize = 10;

  if (!data) return null;

  const { inventory, movements, lowStockItems } = data;

  const getStatusBadge = (item: any) => {
    if (item.currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (item.currentStock <= item.minStock) {
      return <Badge variant="secondary">Low Stock</Badge>;
    } else {
      return <Badge variant="default">In Stock</Badge>;
    }
  };

  const getMovementIcon = (type: string) => {
    return type === 'IN' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const paginate = (array: any[], page: number) => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return array?.slice(start, end) || [];
  };

  const getTotalPages = (array: any[]) => {
    return Math.ceil((array?.length || 0) / pageSize);
  };

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
  }) => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginate(inventory, currentPage.inventory).map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.productId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.currentStock} / {item.minStock}</div>
                        <div className="text-gray-500">{item.zone?.name || 'No Zone'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>${item.unitPrice.toFixed(2)}</div>
                        <div className="text-gray-500">
                          ${(item.currentStock * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={currentPage.inventory}
            totalPages={getTotalPages(inventory)}
            onPageChange={(page) => setCurrentPage(prev => ({ ...prev, inventory: page }))}
          />
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginate(movements, currentPage.movements).map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{movement.product?.name}</div>
                        <div className="text-sm text-gray-500">{movement.product?.productId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.type)}
                        <Badge variant={movement.type === 'IN' ? 'default' : 'secondary'}>
                          {movement.type} {movement.quantity}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{movement.previousStock} → {movement.newStock}</div>
                        <div className="text-gray-500">{movement.reason || 'N/A'}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={currentPage.movements}
            totalPages={getTotalPages(movements)}
            onPageChange={(page) => setCurrentPage(prev => ({ ...prev, movements: page }))}
          />
        </CardContent>
      </Card>

      {/* Low Stock Alerts Table */}
      {lowStockItems && lowStockItems.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Shortage</TableHead>
                    <TableHead>Reorder Value</TableHead>
                    <TableHead>Zone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginate(lowStockItems, currentPage.lowStock).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.productId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="destructive">
                          {item.currentStock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.minStock}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-600 font-medium">
                          {item.minStock - item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">
                          ${((item.minStock - item.currentStock) * item.unitPrice).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.zone?.name || 'No Zone'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationControls
              currentPage={currentPage.lowStock}
              totalPages={getTotalPages(lowStockItems)}
              onPageChange={(page) => setCurrentPage(prev => ({ ...prev, lowStock: page }))}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}