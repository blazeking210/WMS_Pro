import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, Plus, ArrowUpDown, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ProductWithZone } from "@shared/schema";

interface InventoryTableProps {
  showFilters?: boolean;
}

export default function InventoryTable({ showFilters = false }: InventoryTableProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "all" as "all" | "in_stock" | "low_stock" | "out_of_stock",
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.status !== "all") params.append("status", filters.status);
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    retry: false,
  });

  const { data: zones } = useQuery({
    queryKey: ["/api/zones"],
    retry: false,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (product: ProductWithZone) => {
    if (product.currentStock === 0) return "out_of_stock";
    if (product.currentStock <= product.minStock) return "low_stock";
    return "in_stock";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge className="status-in-stock">In Stock</Badge>;
      case "low_stock":
        return <Badge className="status-low-stock">Low Stock</Badge>;
      case "out_of_stock":
        return <Badge className="status-out-of-stock">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = !filters.search || 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.productId.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.category.toLowerCase().includes(filters.search.toLowerCase());

    const matchesCategory = !filters.category || product.category === filters.category;

    const productStatus = getStockStatus(product);
    const matchesStatus = filters.status === "all" || productStatus === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Current Inventory
          </CardTitle>
          {showFilters && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Select value={filters.status} onValueChange={(value: any) => setFilters({...filters, status: value})}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-64"
              />
              <Button 
                className="warehouse-secondary"
                onClick={() => setLocation("/add-product")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Product ID
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>
                Product Name
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>
                Category
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>
                Zone
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>
                Current Stock
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>
                Min. Stock
                <ArrowUpDown className="ml-1 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{product.productId}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center">
                      <Package className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.zone?.name || "No zone"}</TableCell>
                <TableCell>{product.currentStock}</TableCell>
                <TableCell>{product.minStock}</TableCell>
                <TableCell>
                  {getStatusBadge(getStockStatus(product))}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deleteProductMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {!filteredProducts?.length && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No products found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
